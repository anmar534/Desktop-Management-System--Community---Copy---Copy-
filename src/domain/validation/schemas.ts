import { z } from 'zod';
import type { Project, Tender, BankAccount } from '@/data/centralData';

const nonEmptyString = z.string().trim().min(1);
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'يجب أن يكون التاريخ صالحًا بصيغة ISO',
  });

const optionalIsoDate = isoDateString.optional();

const nonNegativeNumber = z.coerce.number().finite().min(0);
const percentageNumber = nonNegativeNumber.max(100);
const generalNumber = z.coerce.number().finite();

const projectBaseSchema = z
  .object({
    name: nonEmptyString,
    client: nonEmptyString,
    status: z.enum(['active', 'completed', 'delayed', 'paused', 'planning']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    progress: percentageNumber,
    contractValue: nonNegativeNumber,
    estimatedCost: nonNegativeNumber,
    actualCost: nonNegativeNumber,
    spent: nonNegativeNumber,
    remaining: generalNumber,
    expectedProfit: generalNumber,
    actualProfit: generalNumber.optional(),
    startDate: isoDateString,
    endDate: isoDateString,
    manager: nonEmptyString,
    team: nonEmptyString,
    location: nonEmptyString,
    phase: nonEmptyString,
    health: z.enum(['green', 'yellow', 'red']),
    lastUpdate: isoDateString,
    nextMilestone: optionalString,
    milestoneDate: optionalIsoDate,
    category: nonEmptyString,
    efficiency: percentageNumber,
    riskLevel: z.enum(['low', 'medium', 'high']),
    budget: nonNegativeNumber,
    value: nonNegativeNumber,
    type: nonEmptyString,
  })
  .strip();

const projectSchema = projectBaseSchema.extend({
  id: nonEmptyString,
});

const projectCreateSchema = projectBaseSchema;
const projectUpdateSchema = projectSchema.partial().strip();

// Quantity item schema for tender BOQ/quantity tables
const quantityItemSchema = z.object({
  id: z.number(),
  serialNumber: z.string(),
  unit: z.string(),
  quantity: z.string(),
  specifications: z.string(),
  originalDescription: z.string().optional(),
  description: z.string().optional(),
  canonicalDescription: z.string().optional(),
});

const tenderBaseSchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString,
    client: nonEmptyString,
    value: nonNegativeNumber,
    totalValue: nonNegativeNumber.optional(),
    documentPrice: z.union([nonNegativeNumber, nonEmptyString, z.null()]).optional(),
    bookletPrice: z.union([nonNegativeNumber, nonEmptyString, z.null()]).optional(),
    status: z.enum(['new', 'under_action', 'ready_to_submit', 'submitted', 'won', 'lost', 'expired', 'cancelled']),
    totalItems: nonNegativeNumber.optional(),
    pricedItems: nonNegativeNumber.optional(),
    itemsPriced: nonNegativeNumber.optional(),
    technicalFilesUploaded: z.boolean().optional(),
    phase: nonEmptyString,
    deadline: isoDateString,
    daysLeft: generalNumber,
    progress: percentageNumber,
    completionPercentage: percentageNumber.optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    team: nonEmptyString,
    manager: nonEmptyString,
    winChance: percentageNumber,
    competition: nonEmptyString,
    submissionDate: isoDateString,
    lastAction: nonEmptyString,
    lastUpdate: isoDateString,
    category: nonEmptyString,
    location: nonEmptyString,
    type: nonEmptyString,
    projectDuration: optionalString,
    description: optionalString,
    resultNotes: optionalString,
    winningBidValue: nonNegativeNumber.optional(),
    ourBidValue: nonNegativeNumber.optional(),
    winDate: optionalIsoDate,
    lostDate: optionalIsoDate,
    resultDate: optionalIsoDate,
    cancelledDate: optionalIsoDate,
    // BOQ/Quantity table fields - allow multiple possible field names
    quantities: z.array(quantityItemSchema).optional(),
    quantityTable: z.array(quantityItemSchema).optional(),
    items: z.array(quantityItemSchema).optional(),
    boqItems: z.array(quantityItemSchema).optional(),
    quantityItems: z.array(quantityItemSchema).optional(),
  })
  .strip();

const tenderSchema = tenderBaseSchema.extend({
  id: nonEmptyString,
});

const tenderCreateSchema = tenderBaseSchema;
const tenderUpdateSchema = tenderSchema.partial().strip();

const bankAccountBaseSchema = z
  .object({
    accountName: nonEmptyString,
    bankName: nonEmptyString,
    accountNumber: nonEmptyString,
    iban: nonEmptyString,
    accountType: z.enum(['current', 'savings', 'investment', 'project']),
    currentBalance: generalNumber,
    currency: nonEmptyString,
    isActive: z.boolean(),
    lastTransactionDate: isoDateString,
    monthlyInflow: generalNumber,
    monthlyOutflow: generalNumber,
  })
  .strip();

const bankAccountSchema = bankAccountBaseSchema.extend({
  id: nonEmptyString,
});

const bankAccountCreateSchema = bankAccountBaseSchema.extend({
  id: nonEmptyString.optional(),
});

const bankAccountUpdateSchema = bankAccountSchema.partial().strip();

export class ValidationError extends Error {
  constructor(public readonly entity: 'project' | 'tender' | 'bankAccount', public readonly details: string) {
    super(`Invalid ${entity} payload: ${details}`);
  }
}

const formatIssues = (issues: z.ZodIssue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path.join('.') || 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

const parseOrThrow = <T>(entity: ValidationError['entity'], schema: z.ZodType<T>, data: unknown): T => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(entity, formatIssues(parsed.error.issues));
  }
  return parsed.data;
};

export const validateProject = (project: Project): Project => parseOrThrow('project', projectSchema, project);
export const validateProjectPayload = (payload: Omit<Project, 'id'>): Omit<Project, 'id'> =>
  parseOrThrow('project', projectCreateSchema, payload);
export const validateProjectUpdate = (updates: Partial<Project>): Partial<Project> =>
  parseOrThrow('project', projectUpdateSchema, updates);

export const validateTender = (tender: Tender): Tender => parseOrThrow('tender', tenderSchema, tender);
export const validateTenderPayload = (payload: Omit<Tender, 'id'>): Omit<Tender, 'id'> =>
  parseOrThrow('tender', tenderCreateSchema, payload);
export const validateTenderUpdate = (updates: Partial<Tender>): Partial<Tender> =>
  parseOrThrow('tender', tenderUpdateSchema, updates);

export const validateBankAccount = (account: BankAccount): BankAccount =>
  parseOrThrow('bankAccount', bankAccountSchema, account);
export const validateBankAccountPayload = (
  payload: Omit<BankAccount, 'id'> & Partial<Pick<BankAccount, 'id'>>,
): Omit<BankAccount, 'id'> & Partial<Pick<BankAccount, 'id'>> =>
  parseOrThrow('bankAccount', bankAccountCreateSchema, payload);
export const validateBankAccountUpdate = (updates: Partial<BankAccount>): Partial<BankAccount> =>
  parseOrThrow('bankAccount', bankAccountUpdateSchema, updates);

export const sanitizeProjectCollection = (projects: Project[]): Project[] => {
  const sanitized: Project[] = [];
  for (const project of projects) {
    try {
      sanitized.push(validateProject(project));
    } catch (error) {
      console.warn(error instanceof Error ? error.message : 'Unable to parse project entry');
    }
  }
  return sanitized;
};

export const sanitizeTenderCollection = (tenders: Tender[]): Tender[] => {
  const sanitized: Tender[] = [];
  for (const tender of tenders) {
    try {
      sanitized.push(validateTender(tender));
    } catch (error) {
      console.warn(error instanceof Error ? error.message : 'Unable to parse tender entry');
    }
  }
  return sanitized;
};

export const sanitizeBankAccountCollection = (accounts: BankAccount[]): BankAccount[] => {
  const sanitized: BankAccount[] = [];
  for (const account of accounts) {
    try {
      sanitized.push(validateBankAccount(account));
    } catch (error) {
      console.warn(error instanceof Error ? error.message : 'Unable to parse bank account entry');
    }
  }
  return sanitized;
};
