export type User = { id: number; email: string };

export type Category = { id: number; name: string; is_active: number };

export type Expense = {
  id: number;
  category_id: number;
  amount: string;
  spent_at: string;
  note: string | null;
};

export type Summary = {
  start: string;
  end: string;
  days: number;
  grand_total: number;
  by_category: Array<{
    category_id: number;
    category_name: string;
    total_amount: number;
    avg_per_day: number;
    percent_of_total: number;
  }>;
};

export type Forecast = {
  forecast_date: string;
  predicted_total: number;
  model: string;
  train_samples: number;
  backtest_mae: number | null;
  backtest_samples: number;
  trend_baht_per_day: number;
  trend_percent_per_day: number;
  data_days_used: number;
};
