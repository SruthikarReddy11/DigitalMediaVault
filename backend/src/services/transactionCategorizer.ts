/**
 * Smart Transaction Categorizer & Parser
 * Analyzes raw bank narrations/descriptions to determine Category, Payment Method,
 * and clean Merchant names according to predefined categories.
 */

export interface ParsedTransactionData {
  category: string;
  paymentMethod: string;
  cleanMerchant: string;
  isRecurring?: boolean;
}

// Category keyword dictionary tailored for Indian banking narrations & UPI
const EXPENSE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    'swiggy', 'zomato', 'mcdonald', 'kfc', 'burger king', 'domino', 'pizza hut',
    'subway', 'starbucks', 'chai point', 'cafe coffee day', 'ccd', 'haldiram',
    'eatfit', 'rebel foods', 'behrouz', 'faasos', 'biryani', 'restaurant',
    'food court', 'dining', 'bakery', 'baker', 'cafe', 'tea stall', 'coffee',
    'barbeque', 'sweet', 'dhaba', 'kitchen', 'bistro', 'canteen'
  ],
  Groceries: [
    'zepto', 'blinkit', 'bigbasket', 'dmart', 'instamart', "nature's basket",
    'reliance fresh', 'more retail', 'spencers', 'kirana', 'supermarket',
    'provision', 'milk', 'dairy', 'amul', 'mother dairy', 'vegetable', 'fruit',
    'grocer', 'super store', 'mandi', 'bazaar'
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'blusmart', 'metro', 'irctc', 'indian railway',
    'makemytrip', 'cleartrip', 'indigo', 'air india', 'akasa', 'petrol',
    'diesel', 'fuel', 'hpcl', 'bpcl', 'iocl', 'shell', 'indian oil', 'fastag',
    'toll', 'parking', 'auto', 'taxi', 'commute', 'cng'
  ],
  Shopping: [
    'amazon', 'amzn', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho',
    'tata cliq', 'zara', 'h&m', 'uniqlo', 'max fashion', 'pantaloons',
    'shoppers stop', 'decathlon', 'croma', 'reliance digital', 'apple store',
    'cloth', 'apparel', 'jewel', 'retail', 'footwear', 'bata', 'lenskart'
  ],
  Subscriptions: [
    'netflix', 'spotify', 'prime video', 'youtube', 'hotstar', 'disney',
    'sonyliv', 'zee5', 'apple music', 'google storage', 'google one', 'icloud',
    'openai', 'chatgpt', 'midjourney', 'medium', 'subscription', 'annual plan'
  ],
  Utilities: [
    'electricity', 'power', 'bescom', 'tata power', 'adani electricity',
    'msedcl', 'torrent power', 'water', 'gas bill', 'igl', 'indane',
    'bharat gas', 'hp gas', 'jio', 'airtel', 'vi ', 'vodafone', 'bsnl',
    'act fibernet', 'broadband', 'recharge', 'postpaid', 'bill desk', 'bbps'
  ],
  Healthcare: [
    'apollo', 'netmeds', '1mg', 'pharmeasy', 'medplus', 'hospital',
    'clinic', 'diagnostic', 'pathlab', 'doctor', 'pharmacy', 'medical',
    'dental', 'dr.', 'eye care', 'chemist'
  ],
  Education: [
    'coursera', 'udemy', 'edureka', 'school', 'college', 'university',
    'tuition', 'fees', 'book store', 'exam', 'institute', 'learning', 'coaching'
  ],
  Entertainment: [
    'bookmyshow', 'pvr', 'inox', 'cinepolis', 'movie', 'concert',
    'gaming', 'steam', 'playstation', 'theme park', 'bowling', 'cinema'
  ],
  Travel: [
    'hotel', 'resort', 'airbnb', 'oyo', 'booking.com', 'agoda', 'trip',
    'tour', 'stay', 'flight', 'bus', 'redbus', 'abhibus', 'holiday'
  ],
  Rent: [
    'rent', 'landlord', 'flat rent', 'apartment rent', 'society maintenance', 'house rent'
  ],
  'EMI/Loans': [
    'emi', 'loan', 'hdfc loan', 'sbi loan', 'bajaj finserv', 'kreditbee',
    'moneytap', 'credit card payment', 'card bill', 'loan repayment', 'repayment'
  ],
};

const INCOME_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Salary: [
    'salary', 'payroll', 'direct credit', 'wages', 'stipend', 'corp sal', 'sal credit'
  ],
  Investments: [
    'dividend', 'mutual fund', 'zerodha', 'groww', 'upstox', 'interest credit',
    'int.pd', 'return', 'fd int', 'capital gain'
  ],
  Freelance: [
    'freelance', 'upwork', 'fiverr', 'consulting', 'client payment', 'invoice'
  ],
  'Rental Income': [
    'tenant', 'rent received', 'rent credit'
  ],
  Gifts: [
    'gift', 'cashback', 'reward', 'bounty'
  ],
};

export class TransactionCategorizer {
  /**
   * Categorize an expense or income based on narration
   */
  public static categorize(narration: string, type: 'EXPENSE' | 'INCOME'): ParsedTransactionData {
    const text = (narration || '').toLowerCase();

    // 1. Detect Payment Method
    let paymentMethod = 'UPI';
    if (text.includes('upi') || text.includes('@') || text.includes('vpa') || text.includes('phonepe') || text.includes('paytm') || text.includes('gpay')) {
      paymentMethod = 'UPI';
    } else if (text.includes('pos ') || text.includes('card ') || text.includes('e-comm') || text.includes('debit card')) {
      paymentMethod = 'Debit Card';
    } else if (text.includes('credit card') || text.includes('cc payment') || text.includes('visa') || text.includes('mastercard')) {
      paymentMethod = 'Credit Card';
    } else if (text.includes('neft') || text.includes('rtgs') || text.includes('imps') || text.includes('inb') || text.includes('netbanking')) {
      paymentMethod = 'Net Banking';
    } else if (text.includes('atm') || text.includes('cash wdl') || text.includes('nwd')) {
      paymentMethod = 'Cash';
    } else {
      paymentMethod = 'Bank Transfer';
    }

    // 2. Detect Clean Merchant Name
    let cleanMerchant = this.extractMerchantName(narration);

    // 3. Detect Category
    let category = 'Other';

    if (type === 'INCOME') {
      for (const [catName, keywords] of Object.entries(INCOME_CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => text.includes(kw))) {
          category = catName;
          break;
        }
      }
    } else {
      for (const [catName, keywords] of Object.entries(EXPENSE_CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => text.includes(kw))) {
          category = catName;
          break;
        }
      }
    }

    return {
      category,
      paymentMethod,
      cleanMerchant,
    };
  }

  /**
   * Clean and extract readable merchant / receiver name from noisy bank narrations
   * e.g., "UPI/SWIGGY/5214829103/swiggy@icici" -> "Swiggy"
   */
  private static extractMerchantName(raw: string): string {
    if (!raw) return 'Bank Transaction';

    const clean = raw.trim();

    // Pattern: UPI/Receiver/RefNo/VPA
    if (clean.toUpperCase().startsWith('UPI/')) {
      const parts = clean.split('/');
      if (parts.length >= 2 && parts[1].trim()) {
        const merchant = parts[1].trim();
        return this.formatCapitalization(merchant);
      }
    }

    // Pattern: POS XX/MERCHANT/CITY
    if (clean.toUpperCase().startsWith('POS ')) {
      const parts = clean.split(/[/ -]+/);
      if (parts.length >= 2) {
        return this.formatCapitalization(parts[1]);
      }
    }

    // Pattern: ACH/MERCHANT or NEFT-MERCHANT
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length >= 2 && parts[1].trim()) {
        return this.formatCapitalization(parts[1].slice(0, 30));
      }
    }

    // Fallback: truncate to 40 characters
    return this.formatCapitalization(clean.slice(0, 40));
  }

  private static formatCapitalization(str: string): string {
    const s = str.trim();
    if (!s) return '';
    return s
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
