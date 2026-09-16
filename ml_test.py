import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
data = {
    'SquareFootage': [
        750, 900, 1100, 1250, 1400,
        1600, 1800, 2000, 2300, 2600,
        2800, 3000, 3200, 3500, 3800
    ],
    'Bedrooms': [
        1, 2, 2, 2, 3,
        3, 3, 3, 4, 4,
        4, 5, 5, 5, 6
    ],
    'Price': [
        150, 175, 205, 230, 255,
        285, 310, 340, 385, 430,
        460, 500, 535, 580, 625
    ]
}

df = pd.DataFrame(data)

print("Dataset:\n", df, "\n")

X = df[['SquareFootage', 'Bedrooms']]
y = df['Price']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("Model Coefficients:")
print(f"  SquareFootage coef: {model.coef_[0]:.4f}")
print(f"  Bedrooms coef:      {model.coef_[1]:.4f}")
print(f"  Intercept:          {model.intercept_:.4f}\n")

print("Mean Squared Error:", mse)
print("R-squared:", r2)

new_house = pd.DataFrame({
    'SquareFootage': [2100],
    'Bedrooms': [3]
})

predicted_price = model.predict(new_house)

print(f"\nPredicted price: {predicted_price[0]:.2f}K")

sqft_range = np.linspace(
    df['SquareFootage'].min(),
    df['SquareFootage'].max(),
    100
)

avg_bedrooms = df['Bedrooms'].mean()

line_input = pd.DataFrame({
    'SquareFootage': sqft_range,
    'Bedrooms': avg_bedrooms
})

line_pred = model.predict(line_input)

plt.figure(figsize=(7, 5))

plt.scatter(
    df['SquareFootage'],
    df['Price'],
    color='blue',
    label='Actual Data (all houses)',
    s=60
)

plt.scatter(
    X_test['SquareFootage'],
    y_pred,
    color='green',
    marker='X',
    s=100,
    label='Predicted (test set)'
)
plt.plot(
    sqft_range,
    line_pred,
    color='red',
    linewidth=2,
    label='Regression Line (avg bedrooms)'
)
plt.xlabel('Square Footage')
plt.ylabel('Price ($1000s)')
plt.title('House Price Prediction: Regression Line & Data')
plt.legend()
plt.grid(alpha=0.3)
plt.show()