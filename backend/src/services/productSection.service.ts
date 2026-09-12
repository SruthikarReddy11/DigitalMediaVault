import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';

export interface CreateSectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  password?: string;
}

export interface UpdateSectionInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  password?: string;
  removePassword?: boolean;
}

export class ProductSectionService {
  /**
   * List all product sections for user with item count and preview images
   */
  public static async listSections(userId: string) {
    const sections = await prisma.productSection.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                imageUrl: true,
                store: true,
                isPurchased: true,
              },
            },
          },
        },
      },
    });

    return sections.map((section) => {
      const totalItems = section.items.length;
      const totalValue = section.items.reduce(
        (sum, item) => sum + (item.product.price || 0),
        0
      );
      const previewImages = section.items
        .map((i) => i.product.imageUrl)
        .filter(Boolean)
        .slice(0, 4) as string[];

      return {
        id: section.id,
        userId: section.userId,
        name: section.name,
        description: section.description,
        color: section.color || '#6366f1',
        icon: section.icon || 'ShoppingBag',
        position: section.position,
        isLocked: section.isLocked,
        totalItems,
        totalValue,
        previewImages,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      };
    });
  }

  /**
   * Get single section by ID with products
   */
  public static async getSectionById(
    userId: string,
    sectionId: string,
    password?: string
  ) {
    const section = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            product: true,
          },
        },
      },
    });

    if (!section) {
      return null;
    }

    // Check password protection
    if (section.isLocked && section.passwordHash) {
      if (!password) {
        return {
          id: section.id,
          userId: section.userId,
          name: section.name,
          description: section.description,
          color: section.color || '#6366f1',
          icon: section.icon || 'ShoppingBag',
          position: section.position,
          isLocked: true,
          isAccessGranted: false,
          totalItems: section.items.length,
          products: [],
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
        };
      }

      const isValid = await bcrypt.compare(password, section.passwordHash);
      if (!isValid) {
        throw new Error('Incorrect password for this section');
      }
    }

    const products = section.items.map((i) => i.product);

    return {
      id: section.id,
      userId: section.userId,
      name: section.name,
      description: section.description,
      color: section.color || '#6366f1',
      icon: section.icon || 'ShoppingBag',
      position: section.position,
      isLocked: section.isLocked,
      isAccessGranted: true,
      totalItems: products.length,
      products,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  /**
   * Verify password to unlock a section
   */
  public static async verifyPassword(
    userId: string,
    sectionId: string,
    password: string
  ): Promise<boolean> {
    const section = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
      select: { id: true, isLocked: true, passwordHash: true },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    if (!section.isLocked || !section.passwordHash) {
      return true; // Not locked
    }

    return await bcrypt.compare(password, section.passwordHash);
  }

  /**
   * Create a new section
   */
  public static async createSection(userId: string, input: CreateSectionInput) {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Section name is required');
    }

    let isLocked = false;
    let passwordHash: string | null = null;

    if (input.password && input.password.trim()) {
      isLocked = true;
      passwordHash = await bcrypt.hash(input.password.trim(), 10);
    }

    // Get max position
    const last = await prisma.productSection.findFirst({
      where: { userId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    const section = await prisma.productSection.create({
      data: {
        userId,
        name,
        description: input.description?.trim() || null,
        color: input.color || '#6366f1',
        icon: input.icon || 'ShoppingBag',
        position,
        isLocked,
        passwordHash,
      },
    });

    return {
      id: section.id,
      userId: section.userId,
      name: section.name,
      description: section.description,
      color: section.color,
      icon: section.icon,
      position: section.position,
      isLocked: section.isLocked,
      totalItems: 0,
      totalValue: 0,
      previewImages: [],
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  /**
   * Update section details or password
   */
  public static async updateSection(
    userId: string,
    sectionId: string,
    input: UpdateSectionInput
  ) {
    const existing = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
    });

    if (!existing) {
      throw new Error('Section not found');
    }

    const data: any = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error('Section name cannot be empty');
      data.name = name;
    }

    if (input.description !== undefined) {
      data.description = input.description.trim() || null;
    }

    if (input.color !== undefined) {
      data.color = input.color;
    }

    if (input.icon !== undefined) {
      data.icon = input.icon;
    }

    if (input.removePassword) {
      data.isLocked = false;
      data.passwordHash = null;
    } else if (input.password && input.password.trim()) {
      data.isLocked = true;
      data.passwordHash = await bcrypt.hash(input.password.trim(), 10);
    }

    const updated = await prisma.productSection.update({
      where: { id: sectionId },
      data,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      icon: updated.icon,
      position: updated.position,
      isLocked: updated.isLocked,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete section
   */
  public static async deleteSection(userId: string, sectionId: string) {
    const existing = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
    });

    if (!existing) {
      throw new Error('Section not found');
    }

    await prisma.productSection.delete({
      where: { id: sectionId },
    });

    return { success: true };
  }

  /**
   * Add products to section
   */
  public static async addProductsToSection(
    userId: string,
    sectionId: string,
    productIds: string[]
  ) {
    const section = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    // Verify all products belong to this user
    const userProducts = await prisma.savedProduct.findMany({
      where: {
        userId,
        id: { in: productIds },
      },
      select: { id: true },
    });

    const validIds = userProducts.map((p) => p.id);

    // Get current items count to determine start position
    const currentCount = await prisma.productSectionItem.count({
      where: { sectionId },
    });

    // Create records
    const created = await Promise.all(
      validIds.map((productId, idx) =>
        prisma.productSectionItem.upsert({
          where: {
            sectionId_productId: { sectionId, productId },
          },
          update: {},
          create: {
            sectionId,
            productId,
            position: currentCount + idx,
          },
        })
      )
    );

    return {
      addedCount: created.length,
      sectionId,
    };
  }

  /**
   * Remove a product from a section
   */
  public static async removeProductFromSection(
    userId: string,
    sectionId: string,
    productId: string
  ) {
    const section = await prisma.productSection.findFirst({
      where: { id: sectionId, userId },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    await prisma.productSectionItem.deleteMany({
      where: {
        sectionId,
        productId,
      },
    });

    return { success: true, sectionId, productId };
  }

  /**
   * Get all section IDs that a product belongs to
   */
  public static async getProductSections(userId: string, productId: string) {
    const items = await prisma.productSectionItem.findMany({
      where: {
        productId,
        section: { userId },
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isLocked: true,
          },
        },
      },
    });

    return items.map((item) => item.section);
  }
}
