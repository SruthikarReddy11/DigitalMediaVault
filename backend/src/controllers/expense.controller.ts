import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ExpenseService } from '../services/expense.service';

export class ExpenseController {
  /**
   * List expenses with filters and pagination
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const {
        search,
        type,
        category,
        person,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const filters: any = {};
      if (search) filters.search = String(search);
      if (type) filters.type = String(type);
      if (category) filters.category = String(category);
      if (person) filters.person = String(person);
      if (startDate) filters.startDate = String(startDate);
      if (endDate) filters.endDate = String(endDate);
      if (minAmount !== undefined && minAmount !== '') filters.minAmount = Number(minAmount);
      if (maxAmount !== undefined && maxAmount !== '') filters.maxAmount = Number(maxAmount);
      if (sortBy) filters.sortBy = String(sortBy);
      if (sortOrder) filters.sortOrder = String(sortOrder);
      if (page) filters.page = Number(page);
      if (limit) filters.limit = Number(limit);

      const result = await ExpenseService.listExpenses(userId, filters);
      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new expense or income
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const created = await ExpenseService.createExpense(userId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Expense recorded successfully',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to create expense' },
      });
    }
  }

  /**
   * Get single expense details
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const item = await ExpenseService.getExpenseById(userId, id);
      res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: { message: err.message || 'Expense not found' },
      });
    }
  }

  /**
   * Update an existing expense
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      const updated = await ExpenseService.updateExpense(userId, id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Expense updated successfully',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to update expense' },
      });
    }
  }

  /**
   * Delete an expense
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);
      await ExpenseService.deleteExpense(userId, id);
      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || 'Failed to delete expense' },
      });
    }
  }

  /**
   * Compute and return expense analytics, monthly breakdown, and peak month "why" diagnosis
   */
  public static async analytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { year, months } = req.query;
      const analytics = await ExpenseService.getExpenseAnalytics(userId, {
        year: year ? Number(year) : undefined,
        months: months ? Number(months) : undefined,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Seed realistic sample data
   */
  public static async seedSample(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await ExpenseService.seedSampleExpenses(userId);
      res.json({
        success: true,
        message: `Successfully seeded ${result.count} sample expense transactions across 5 months`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export expenses as CSV
   */
  public static async exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const csv = await ExpenseService.exportExpensesCsv(userId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="expenses_export_${new Date().toISOString().slice(0, 10)}.csv"`
      );
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
