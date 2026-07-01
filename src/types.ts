export interface DashboardMetrics {
  kpis: {
    totalSales: number;
    netProfitMargin: number;
    inventoryValue: number;
    shrinkageRate: number;
  };
  salesTrend: Array<{ name: string; 1402: number; 1403: number }>;
  paretoData: Array<{ name: string; value: number; percentage: number }>;
}

export interface UploadedFile {
  id: number;
  filename: string;
  original_name: string;
  upload_date: string;
  module_type: string;
  row_count: number;
}

export type ModuleField = { key: string; label: string; required: boolean };
export type ModuleConfig = { label: string; fields: ModuleField[] };

export const MODULES: Record<string, ModuleConfig> = {
  products: {
    label: "اطلاعات پایه کالا (پروفایل محصولات)",
    fields: [
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "عنوان کالا", required: true },
      { key: "mainGroup", label: "گروه اصلی", required: true },
      { key: "subGroup", label: "زیر گروه", required: false },
      { key: "activityCenter", label: "مرکز فعالیت (هزینه‌یابی)", required: false },
      { key: "vatPercent", label: "درصد ارزش افزوده (%)", required: false },
      { key: "unit", label: "نام واحد سنجش", required: false }
    ]
  },
  sales: {
    label: "فروش و صندوق (عملیات خروج)",
    fields: [
      { key: "date", label: "تاریخ فروش", required: true },
      { key: "time", label: "ساعت فروش", required: false },
      { key: "invoiceCode", label: "شماره فاکتور", required: true },
      { key: "cashierCode", label: "کد صندوق‌دار", required: false },
      { key: "costCenter", label: "مرکز فعالیت (صندوق/لاین)", required: false },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "quantity", label: "تعداد فروش", required: true },
      { key: "price", label: "نرخ فروش (واحد)", required: false },
      { key: "totalPrice", label: "مبلغ کل فروش", required: false },
      { key: "vatAmount", label: "ارزش افزوده ردیف", required: false },
      { key: "lastPurchasePrice", label: "آخرین نرخ خرید", required: false },
      { key: "costPrice", label: "بهای تمام شده", required: false }
    ]
  },
  purchases: {
    label: "خرید و تامین (عملیات ورود)",
    fields: [
      { key: "date", label: "تاریخ خرید/رسید", required: true },
      { key: "time", label: "ساعت ثبت", required: false },
      { key: "receiptCode", label: "شماره رسید/فاکتور تامین", required: true },
      { key: "supplier", label: "تفصیلی/طرف حساب", required: true },
      { key: "costCenter", label: "مرکز فعالیت (انبار/خرید)", required: false },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "quantity", label: "مقدار/تعداد", required: true },
      { key: "price", label: "نرخ خرید", required: true },
      { key: "vatAmount", label: "مبلغ ارزش افزوده", required: false }
    ]
  },
  opening_inventory: {
    label: "موجودی اول دوره",
    fields: [
      { key: "date", label: "تاریخ", required: true },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "quantity", label: "مقدار/تعداد", required: true },
      { key: "price", label: "ارزش ریالی واحد", required: false }
    ]
  },
  purchase_returns: {
    label: "برگشت از خرید",
    fields: [
      { key: "date", label: "تاریخ برگشت", required: true },
      { key: "receiptCode", label: "شماره رسید/فاکتور", required: true },
      { key: "supplier", label: "تفصیلی/طرف حساب", required: false },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "quantity", label: "مقدار برگشتی", required: true },
      { key: "price", label: "نرخ خرید", required: true }
    ]
  },
  sales_returns: {
    label: "برگشت از فروش",
    fields: [
      { key: "date", label: "تاریخ برگشت", required: true },
      { key: "invoiceCode", label: "شماره فاکتور مرجع", required: true },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "quantity", label: "مقدار برگشتی", required: true },
      { key: "price", label: "نرخ فروش", required: true }
    ]
  },
  finance_cash: {
    label: "خزانه‌داری - صندوق (وجوه نقد)",
    fields: [
      { key: "date", label: "تاریخ تراکنش", required: true },
      { key: "account", label: "سرفصل حساب (صندوق)", required: true },
      { key: "costCenter", label: "مرکز فعالیت / صندوقدار", required: false },
      { key: "amount", label: "مبلغ", required: true },
      { key: "description", label: "شرح سند", required: false },
      { key: "transactionType", label: "نوع تراکنش (ورود/خروج)", required: true }
    ]
  },
  finance_bank: {
    label: "خزانه‌داری - بانک (حساب‌های بانکی)",
    fields: [
      { key: "date", label: "تاریخ تراکنش", required: true },
      { key: "account", label: "سرفصل حساب (بانک)", required: true },
      { key: "amount", label: "مبلغ", required: true },
      { key: "description", label: "شرح سند", required: false },
      { key: "transactionType", label: "نوع تراکنش (ورود/خروج)", required: true }
    ]
  },
  finance_expense: {
    label: "بهای تمام شده - هزینه‌ها (مراکز فعالیت)",
    fields: [
      { key: "date", label: "تاریخ تراکنش", required: true },
      { key: "account", label: "سرفصل هزینه (معین)", required: true },
      { key: "costCenter", label: "مرکز فعالیت / هزینه", required: true },
      { key: "amount", label: "مبلغ هزینه", required: true },
      { key: "expenseType", label: "رفتار هزینه (ثابت/متغیر)", required: false },
      { key: "description", label: "شرح سند", required: false }
    ]
  },
  cost_control: {
    label: "هزینه‌های سازمان (ماژول کنترل هزینه)",
    fields: [
      { key: "date", label: "تاریخ تراکنش", required: true },
      { key: "account", label: "سرفصل هزینه (معین)", required: true },
      { key: "tafsil", label: "تفصیل هزینه", required: false },
      { key: "amount", label: "مبلغ هزینه", required: true },
      { key: "expenseType", label: "رفتار هزینه (ثابت/متغیر)", required: false },
      { key: "description", label: "شرح سند", required: false }
    ]
  },
  inventory_adjustments: {
    label: "انبارگردانی و تعدیلات موجودی",
    fields: [
      { key: "date", label: "تاریخ انبارگردانی", required: true },
      { key: "productCode", label: "کد کالا", required: true },
      { key: "productName", label: "نام کالا", required: false },
      { key: "countedQuantity", label: "تعداد شمارش شده (واقعی)", required: false },
      { key: "adjustmentQuantity", label: "مقدار تعدیل (کسری/اضافی)", required: false },
      { key: "description", label: "شرح / علت تعدیل", required: false }
    ]
  },
  hr: {
    label: "منابع انسانی (تردد و راندمان)",
    fields: [
      { key: "date", label: "تاریخ", required: true },
      { key: "personnelCode", label: "کد پرسنلی/صندوقدار", required: true },
      { key: "personnelName", label: "نام و نام خانوادگی", required: true },
      { key: "role", label: "سمت/نقش", required: false },
      { key: "costCenter", label: "مرکز هزینه/شعبه", required: false },
      { key: "startDate", label: "تاریخ شروع به کار", required: false },
      { key: "endDate", label: "تاریخ ترک کار", required: false },
      { key: "entranceTime", label: "ساعت ورود", required: false },
      { key: "exitTime", label: "ساعت خروج", required: false }
    ]
  }
};
