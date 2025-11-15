flowchart TD
  A[User opens app] --> B{Authenticated}
  B -- No --> C[Redirect to login]
  C --> D[Login success]
  B -- Yes --> E[Dashboard]
  D --> E
  E --> F[View invoice list]
  F --> G[Select invoice]
  G --> H[View invoice detail]
  H --> I{User is admin}
  I -- Yes --> J[Show edit controls]
  I -- No --> K[Show read only]
  J --> L[Edit invoice]
  L --> M[Invoice form]
  M --> N[Save invoice]
  N --> F
  E --> O[Create new invoice]
  O --> M
  subgraph External events
    P[Payment webhook] --> Q[Update invoice status]
    R[Cron job send reminders] --> S[Send reminder emails]
  end