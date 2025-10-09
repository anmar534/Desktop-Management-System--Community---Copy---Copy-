import type {
	Budget,
	Client,
	FinancialReport,
	Invoice,
	Project,
	Tender,
	BankAccount
} from '@/data/centralData'
import type { Expense } from '@/data/expenseCategories'
import { ProjectCostAnalyzer } from '@/domain/services/projectCostAnalyzer'
import { TenderMetricsService } from '@/domain/services/tenderMetricsService'
import { CashflowService } from '@/domain/services/cashflowService'
import type {
	CashflowEntry,
	CashflowSummary,
	ProjectCostSnapshot,
	ProjectCostSummary,
	TenderMetricsSummary,
	TenderMonthlyStat,
	TenderSnapshot
} from '@/domain/contracts/metrics'

export interface InvoiceMetrics {
	totalCount: number
	totalValue: number
	paidAmount: number
	outstandingAmount: number
	overdueCount: number
	draftCount: number
	sentCount: number
	cancelledCount: number
	latestActivity: string | null
}

export interface BudgetMetrics {
	totalCount: number
	totalAllocated: number
	totalSpent: number
	totalRemaining: number
	activeCount: number
	overBudgetCount: number
	underUtilizedCount: number
}

export interface FinancialReportMetrics {
	totalCount: number
	completedCount: number
	generatingCount: number
	failedCount: number
	pendingCount: number
	totalSizeInBytes: number
	latestCompletedAt: string | null
}

export interface FinancialSummaryMetrics {
	outstandingInvoices: number
	overdueInvoices: number
	availableBudget: number
	runningReportJobs: number
	activeClients: number
}

export interface ProjectMetrics {
	totalCount: number
	activeCount: number
	completedCount: number
	delayedCount: number
	criticalCount: number
	averageProgress: number
	totalContractValue: number
	totalExpectedProfit: number
	onTrackCount: number
	costSummary: ProjectCostSummary
}

export interface TenderMetrics {
	totalCount: number
	activeCount: number
	submittedCount: number
	wonCount: number
	lostCount: number
	upcomingDeadlines: number
	averageWinChance: number
	performance: TenderMetricsSummary
}

export interface ClientMetrics {
	totalCount: number
	activeCount: number
	inactiveCount: number
	strategicRelationshipCount: number
	highPaymentRatingCount: number
	totalOutstandingPayments: number
	averageCompletedProjects: number
}

export interface AggregatedFinancialMetrics {
	invoices: InvoiceMetrics
	budgets: BudgetMetrics
	reports: FinancialReportMetrics
	projects: ProjectMetrics
	tenders: TenderMetrics
	clients: ClientMetrics
	summary: FinancialSummaryMetrics
}

export interface FinancialHighlights {
	outstandingInvoices: Invoice[]
	budgetsAtRisk: Budget[]
	recentReports: FinancialReport[]
	projectsAtRisk: Project[]
	tendersClosingSoon: Tender[]
}

export interface DashboardMetricsResult {
	projectCost: ProjectCostSummary
	tenderPerformance: TenderMetricsSummary
	tenderMonthly: TenderMonthlyStat[]
	cashflow: CashflowSummary
	totals: {
		activeProjects: number
		openTenders: number
		cashOnHand: number
		monthlyBurn: number
		runwayDays: number | null
	}
	currency: {
		base: string
		rates: Record<string, number>
		lastUpdated: string | null
	}
}

const ACTIVE_PROJECT_STATUSES = new Set<Project['status']>(['active', 'planning'])
const ACTIVE_TENDER_STATUSES = new Set<Tender['status']>(['new', 'under_action', 'ready_to_submit', 'submitted'])

const clampNumber = (value: number): number => (Number.isFinite(value) ? Number(value) : 0)

const mapProjectsToSnapshots = (projects: Project[]): ProjectCostSnapshot[] =>
	projects.map((project) => ({
		id: project.id,
		description: project.name,
		category: project.category,
		estimatedTotal: clampNumber(project.estimatedCost ?? project.budget ?? 0),
		actualTotal: clampNumber(project.actualCost ?? project.spent ?? 0)
	}))

const mapTendersToSnapshots = (tenders: Tender[]): TenderSnapshot[] =>
	tenders.map((tender) => ({
		id: tender.id,
		status: tender.status,
		value: tender.value,
		submissionDate: tender.submissionDate,
		winDate: tender.winDate,
		lostDate: tender.lostDate,
		documentPrice: tender.documentPrice,
		bookletPrice: tender.bookletPrice
	}))

const buildInvoiceMetrics = (invoices: Invoice[]): InvoiceMetrics => {
	let totalValue = 0
	let paidAmount = 0
	let outstandingAmount = 0
	let overdueCount = 0
	let draftCount = 0
	let sentCount = 0
	let cancelledCount = 0
	let latestActivity = 0

	for (const invoice of invoices) {
		const invoiceTotal = clampNumber(invoice.total)
		totalValue += invoiceTotal

		const createdAt = new Date(invoice.createdAt ?? invoice.issueDate ?? 0).getTime()
		if (!Number.isNaN(createdAt)) {
			latestActivity = Math.max(latestActivity, createdAt)
		}

		switch (invoice.status) {
			case 'paid':
				paidAmount += invoiceTotal
				break
			case 'overdue':
				overdueCount += 1
				outstandingAmount += invoiceTotal
				break
			case 'sent':
				sentCount += 1
				outstandingAmount += invoiceTotal
				break
			case 'draft':
				draftCount += 1
				outstandingAmount += invoiceTotal
				break
			case 'cancelled':
				cancelledCount += 1
				break
			default:
				break
		}
	}

	return {
		totalCount: invoices.length,
		totalValue,
		paidAmount,
		outstandingAmount,
		overdueCount,
		draftCount,
		sentCount,
		cancelledCount,
		latestActivity: latestActivity > 0 ? new Date(latestActivity).toISOString() : null
	}
}

const buildBudgetMetrics = (budgets: Budget[]): BudgetMetrics => {
	let totalAllocated = 0
	let totalSpent = 0
	let totalRemaining = 0
	let activeCount = 0
	let overBudgetCount = 0
	let underUtilizedCount = 0

	for (const budget of budgets) {
		const allocated = clampNumber(budget.totalAmount)
		const spent = clampNumber(budget.spentAmount)
		totalAllocated += allocated
		totalSpent += spent
		totalRemaining += allocated - spent

		if (budget.status === 'active') {
			activeCount += 1
		}
		if (budget.utilizationPercentage > 100) {
			overBudgetCount += 1
		}
		if (budget.status === 'active' && budget.utilizationPercentage < 50) {
			underUtilizedCount += 1
		}
	}

	return {
		totalCount: budgets.length,
		totalAllocated,
		totalSpent,
		totalRemaining,
		activeCount,
		overBudgetCount,
		underUtilizedCount
	}
}

const buildFinancialReportMetrics = (reports: FinancialReport[]): FinancialReportMetrics => {
	let completedCount = 0
	let generatingCount = 0
	let failedCount = 0
	let pendingCount = 0
	let totalSizeInBytes = 0
	let latestCompleted = 0

	for (const report of reports) {
		if (Number.isFinite(report.size)) {
			totalSizeInBytes += clampNumber(report.size ?? 0)
		}

		const completedAt = report.completedAt ? new Date(report.completedAt).getTime() : NaN
		if (!Number.isNaN(completedAt)) {
			latestCompleted = Math.max(latestCompleted, completedAt)
		}

		switch (report.status) {
			case 'completed':
				completedCount += 1
				break
			case 'generating':
				generatingCount += 1
				break
			case 'failed':
				failedCount += 1
				break
			case 'pending':
				pendingCount += 1
				break
			default:
				break
		}
	}

	return {
		totalCount: reports.length,
		completedCount,
		generatingCount,
		failedCount,
		pendingCount,
		totalSizeInBytes,
		latestCompletedAt: latestCompleted > 0 ? new Date(latestCompleted).toISOString() : null
	}
}

type ProjectCostAnalyzerLike = Pick<typeof ProjectCostAnalyzer, 'summarize'>
type TenderMetricsServiceLike = Pick<typeof TenderMetricsService, 'summarize' | 'monthly'>
type CashflowServiceLike = Pick<typeof CashflowService, 'summarize'>

const buildProjectMetrics = (projects: Project[], analyzer: ProjectCostAnalyzerLike = ProjectCostAnalyzer): ProjectMetrics => {
	let activeCount = 0
	let completedCount = 0
	let delayedCount = 0
	let criticalCount = 0
	let progressTotal = 0
	let totalContractValue = 0
	let totalExpectedProfit = 0
	let onTrackCount = 0

	for (const project of projects) {
		if (ACTIVE_PROJECT_STATUSES.has(project.status)) {
			activeCount += 1
		}
		if (project.status === 'completed') {
			completedCount += 1
		}
		if (project.status === 'delayed') {
			delayedCount += 1
		}
		if (project.priority === 'critical' || project.health === 'red' || project.riskLevel === 'high') {
			criticalCount += 1
		}
		if (project.health === 'green') {
			onTrackCount += 1
		}

		totalContractValue += clampNumber(project.contractValue ?? project.value ?? 0)
		totalExpectedProfit += clampNumber(project.expectedProfit)
		progressTotal += clampNumber(project.progress)
	}

	const totalCount = projects.length
	const averageProgress = totalCount > 0 ? progressTotal / totalCount : 0
	const costSummary = analyzer.summarize(mapProjectsToSnapshots(projects))

	return {
		totalCount,
		activeCount,
		completedCount,
		delayedCount,
		criticalCount,
		averageProgress,
		totalContractValue,
		totalExpectedProfit,
		onTrackCount,
		costSummary
	}
}

const buildTenderMetrics = (tenders: Tender[], service: TenderMetricsServiceLike = TenderMetricsService): TenderMetrics => {
	let activeCount = 0
	let submittedCount = 0
	let wonCount = 0
	let lostCount = 0
	let upcomingDeadlines = 0
	let winChanceTotal = 0
	let winChanceSamples = 0

	const getDaysUntilDeadline = (tender: Tender): number => {
		const normalizedDaysLeft = typeof tender.daysLeft === 'number' ? tender.daysLeft : Number(tender.daysLeft)
		if (Number.isFinite(normalizedDaysLeft)) {
			return Number(normalizedDaysLeft)
		}
		if (!tender.deadline) {
			return Number.POSITIVE_INFINITY
		}
		const deadlineMs = new Date(tender.deadline).getTime()
		if (Number.isNaN(deadlineMs)) {
			return Number.POSITIVE_INFINITY
		}
		return Math.round((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24))
	}

	for (const tender of tenders) {
		if (ACTIVE_TENDER_STATUSES.has(tender.status)) {
			activeCount += 1
		}
		if (tender.status === 'submitted' || tender.status === 'ready_to_submit') {
			submittedCount += 1
		}
		if (tender.status === 'won') {
			wonCount += 1
		}
		if (tender.status === 'lost') {
			lostCount += 1
		}

		const winChance = clampNumber(tender.winChance)
		if (!Number.isNaN(winChance)) {
			winChanceTotal += winChance
			winChanceSamples += 1
		}

		const daysUntilDeadline = getDaysUntilDeadline(tender)
		if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && ACTIVE_TENDER_STATUSES.has(tender.status)) {
			upcomingDeadlines += 1
		}
	}

	const totalCount = tenders.length
	const averageWinChance = winChanceSamples > 0 ? winChanceTotal / winChanceSamples : 0
	const performance = service.summarize(mapTendersToSnapshots(tenders))

	return {
		totalCount,
		activeCount,
		submittedCount,
		wonCount,
		lostCount,
		upcomingDeadlines,
		averageWinChance,
		performance
	}
}

const buildClientMetrics = (clients: Client[]): ClientMetrics => {
	let activeCount = 0
	let inactiveCount = 0
	let strategicRelationshipCount = 0
	let highPaymentRatingCount = 0
	let outstandingPaymentsTotal = 0
	let completedProjectsTotal = 0

	for (const client of clients) {
		if (client.status === 'active') {
			activeCount += 1
		} else {
			inactiveCount += 1
		}

		if (client.relationship === 'strategic') {
			strategicRelationshipCount += 1
		}

		if (client.paymentRating === 'excellent' || client.paymentRating === 'good') {
			highPaymentRatingCount += 1
		}

		outstandingPaymentsTotal += clampNumber(client.outstandingPayments ?? 0)
		completedProjectsTotal += clampNumber(client.completedProjects ?? 0)
	}

	const totalCount = clients.length
	const averageCompletedProjects = totalCount > 0 ? completedProjectsTotal / totalCount : 0

	return {
		totalCount,
		activeCount,
		inactiveCount,
		strategicRelationshipCount,
		highPaymentRatingCount,
		totalOutstandingPayments: outstandingPaymentsTotal,
		averageCompletedProjects
	}
}

export const selectAggregatedFinancialMetrics = (params: {
	invoices: Invoice[]
	budgets: Budget[]
	reports: FinancialReport[]
	projects: Project[]
	tenders: Tender[]
	clients: Client[]
}): AggregatedFinancialMetrics => {
	const invoiceMetrics = buildInvoiceMetrics(params.invoices)
	const budgetMetrics = buildBudgetMetrics(params.budgets)
	const reportMetrics = buildFinancialReportMetrics(params.reports)
	const projectMetrics = buildProjectMetrics(params.projects)
	const tenderMetrics = buildTenderMetrics(params.tenders)
	const clientMetrics = buildClientMetrics(params.clients)

	return {
		invoices: invoiceMetrics,
		budgets: budgetMetrics,
		reports: reportMetrics,
		projects: projectMetrics,
		tenders: tenderMetrics,
		clients: clientMetrics,
		summary: {
			outstandingInvoices: invoiceMetrics.outstandingAmount,
			overdueInvoices: invoiceMetrics.overdueCount,
			availableBudget: budgetMetrics.totalRemaining,
			runningReportJobs: reportMetrics.generatingCount,
			activeClients: clientMetrics.activeCount
		}
	}
}

export const selectFinancialHighlights = (params: {
	invoices: Invoice[]
	budgets: Budget[]
	reports: FinancialReport[]
	projects: Project[]
	tenders: Tender[]
}): FinancialHighlights => {
	const getInvoiceTimestamp = (invoice: Invoice) => new Date(invoice.dueDate ?? invoice.issueDate ?? 0).getTime()
	const outstandingInvoices = params.invoices
		.filter((invoice) => invoice.status !== 'paid')
		.sort((a, b) => getInvoiceTimestamp(b) - getInvoiceTimestamp(a))
		.slice(0, 5)

	const budgetsAtRisk = params.budgets
		.filter((budget) => budget.utilizationPercentage > 100)
		.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
		.slice(0, 5)

	const getReportTimestamp = (report: FinancialReport) => new Date(report.createdAt ?? report.completedAt ?? 0).getTime()
	const recentReports = [...params.reports]
		.sort((a, b) => getReportTimestamp(b) - getReportTimestamp(a))
		.slice(0, 5)

	const getProjectTimestamp = (project: Project) => new Date(project.lastUpdate ?? 0).getTime()
	const projectsAtRisk = params.projects
		.filter((project) => project.health === 'red' || project.riskLevel === 'high' || project.priority === 'critical')
		.sort((a, b) => getProjectTimestamp(b) - getProjectTimestamp(a))
		.slice(0, 5)

	const getTenderDeadline = (tender: Tender): number => {
		const normalizedDaysLeft = typeof tender.daysLeft === 'number' ? tender.daysLeft : Number(tender.daysLeft)
		if (Number.isFinite(normalizedDaysLeft)) {
			return Number(normalizedDaysLeft)
		}
		if (!tender.deadline) {
			return Number.POSITIVE_INFINITY
		}
		const deadlineMs = new Date(tender.deadline).getTime()
		if (Number.isNaN(deadlineMs)) {
			return Number.POSITIVE_INFINITY
		}
		return Math.round((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24))
	}

	const tendersClosingSoon = params.tenders
		.filter((tender) => ACTIVE_TENDER_STATUSES.has(tender.status))
		.filter((tender) => {
			const daysUntil = getTenderDeadline(tender)
			return daysUntil >= 0 && daysUntil <= 14
		})
		.sort((a, b) => getTenderDeadline(a) - getTenderDeadline(b))
		.slice(0, 5)

	return {
		outstandingInvoices,
		budgetsAtRisk,
		recentReports,
		projectsAtRisk,
		tendersClosingSoon
	}
}

const mapExpensesToCashflow = (expenses: Expense[]): CashflowEntry[] =>
	expenses.map((expense) => ({
		id: expense.id,
		type: 'outflow',
		amount: clampNumber(expense.amount),
		date: expense.createdAt,
		category: expense.categoryId,
		projectId: expense.projectId
	}))

const mapInvoicesToCashflow = (invoices: Invoice[]): CashflowEntry[] => {
	const entries: CashflowEntry[] = []
	for (const invoice of invoices) {
		if (invoice.status !== 'paid' && invoice.status !== 'sent' && invoice.status !== 'overdue') {
			continue
		}
		const date = invoice.paidAt ?? invoice.dueDate ?? invoice.issueDate
		entries.push({
			id: `${invoice.id}-cashflow`,
			type: 'inflow',
			amount: clampNumber(invoice.total),
			date
		})
	}
	return entries
}

interface CurrencyNormalizationOptions {
	baseCurrency: string
	currencyRates?: Record<string, number>
}

const normalizeCurrency = (
	amount: number,
	currency: string | undefined,
	options: CurrencyNormalizationOptions
): number => {
	const safeAmount = clampNumber(amount)
	if (!currency || currency === options.baseCurrency) {
		return safeAmount
	}
	const rate = options.currencyRates?.[currency]
	if (!rate || !Number.isFinite(rate) || rate <= 0) {
		return safeAmount
	}
	return safeAmount * rate
}

const mapBankAccountsToCashflow = (
	accounts: BankAccount[],
	asOf: Date,
	currencyOptions: CurrencyNormalizationOptions
): CashflowEntry[] =>
	accounts.flatMap((account) => {
		const baseDate = asOf.toISOString()
		const inflowEntry: CashflowEntry | undefined = account.monthlyInflow
			? {
				id: `${account.id}-expected-inflow`,
				type: 'inflow',
				amount: normalizeCurrency(account.monthlyInflow, account.currency, currencyOptions),
				date: baseDate,
				category: 'bank-inflow',
				notes: `تدفق شهري متوقع للحساب ${account.accountName}`
			}
			: undefined
		const outflowEntry: CashflowEntry | undefined = account.monthlyOutflow
			? {
				id: `${account.id}-expected-outflow`,
				type: 'outflow',
				amount: normalizeCurrency(account.monthlyOutflow, account.currency, currencyOptions),
				date: baseDate,
				category: 'bank-outflow',
				notes: `صروف شهرية متوقعة للحساب ${account.accountName}`
			}
			: undefined
		return [inflowEntry, outflowEntry].filter((entry): entry is CashflowEntry => Boolean(entry))
	})

export const selectDashboardMetrics = (params: {
	projects: Project[]
	tenders: Tender[]
	invoices: Invoice[]
	expenses: Expense[]
	bankAccounts: BankAccount[]
	options?: {
		asOf?: Date
		startingBalanceFallback?: number
		cashflowServiceInstance?: CashflowServiceLike
		projectAnalyzerInstance?: ProjectCostAnalyzerLike
		tenderServiceInstance?: TenderMetricsServiceLike
		baseCurrency?: string
		currencyRates?: Record<string, number>
		currencyTimestamp?: string | null
	}
}): DashboardMetricsResult => {
	const asOf = params.options?.asOf ?? new Date()
	const startingBalanceFallback = params.options?.startingBalanceFallback ?? 0
	const cashflowInstance = params.options?.cashflowServiceInstance ?? CashflowService
	const projectAnalyzerInstance = params.options?.projectAnalyzerInstance ?? ProjectCostAnalyzer
	const tenderServiceInstance = params.options?.tenderServiceInstance ?? TenderMetricsService
	const currencyOptions: CurrencyNormalizationOptions = {
		baseCurrency: params.options?.baseCurrency ?? 'SAR',
		currencyRates: params.options?.currencyRates
	}
	const currencyTimestamp = params.options?.currencyTimestamp ?? null

	const projectCost = projectAnalyzerInstance.summarize(mapProjectsToSnapshots(params.projects))
	const tenderPerformance = tenderServiceInstance.summarize(mapTendersToSnapshots(params.tenders))
	const tenderMonthly = tenderServiceInstance.monthly(mapTendersToSnapshots(params.tenders))

	const startingBalance = params.bankAccounts.reduce(
		(total, account) => total + normalizeCurrency(account.currentBalance, account.currency, currencyOptions),
		0
	)
	const cashflowEntries: CashflowEntry[] = [
		...mapExpensesToCashflow(params.expenses),
		...mapInvoicesToCashflow(params.invoices),
		...mapBankAccountsToCashflow(params.bankAccounts, asOf, currencyOptions)
	]

	const cashflow = cashflowInstance.summarize(cashflowEntries, {
		startingBalance: startingBalance || startingBalanceFallback
	})

	const activeProjects = params.projects.filter((project) => ACTIVE_PROJECT_STATUSES.has(project.status)).length
	const openTenders = params.tenders.filter((tender) => ACTIVE_TENDER_STATUSES.has(tender.status)).length
	const monthlyBurn = cashflow.totals.burnRate * 30

	return {
		projectCost,
		tenderPerformance,
		tenderMonthly,
		cashflow,
		totals: {
			activeProjects,
			openTenders,
			cashOnHand: startingBalance || startingBalanceFallback,
			monthlyBurn,
			runwayDays: cashflow.totals.runwayDays
		},
		currency: {
			base: currencyOptions.baseCurrency,
			rates: { ...(currencyOptions.currencyRates ?? {}) },
			lastUpdated: currencyTimestamp
		}
	}
}
