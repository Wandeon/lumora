'use client';

interface OrderStatusTimelineProps {
  order: {
    status: string;
    createdAt: string;
    paidAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };
}

interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
  date: string | null;
}

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(order.status);

  const steps: TimelineStep[] = [
    {
      label: 'Order Placed',
      status: currentIndex >= 0 ? 'completed' : 'pending',
      date: order.createdAt,
    },
    {
      label: 'Payment Confirmed',
      status:
        currentIndex >= 1
          ? 'completed'
          : currentIndex === 0
            ? 'current'
            : 'pending',
      date: order.paidAt,
    },
    {
      label: 'Processing',
      status:
        currentIndex >= 2
          ? 'completed'
          : currentIndex === 1
            ? 'current'
            : 'pending',
      date: null,
    },
    {
      label: 'Shipped',
      status:
        currentIndex >= 3
          ? 'completed'
          : currentIndex === 2
            ? 'current'
            : 'pending',
      date: order.shippedAt,
    },
    {
      label: 'Delivered',
      status:
        currentIndex >= 4
          ? 'completed'
          : currentIndex === 3
            ? 'current'
            : 'pending',
      date: order.deliveredAt,
    },
  ];

  // Handle cancelled/refunded status
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <span className="text-red-600 font-medium">
          Order {order.status === 'cancelled' ? 'Cancelled' : 'Refunded'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start gap-4">
          {/* Status indicator */}
          <div className="flex flex-col items-center">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-emerald-500'
                  : step.status === 'current'
                    ? 'bg-emerald-500 ring-4 ring-emerald-100'
                    : 'bg-gray-200'
              }`}
            >
              {step.status === 'completed' && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-0.5 h-8 ${
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 pb-4">
            <p
              className={`font-medium ${
                step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-sm text-gray-500">
                {new Date(step.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
