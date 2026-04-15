import React from 'react';
import { motion } from 'framer-motion';
import { Check, Coffee, Package, Flame, Clock } from 'lucide-react';

/**
 * BREW LUNA — Order Status Stepper
 * Visual progress indicator for order status
 */

const steps = [
  { id: 'new', label: 'Order Received', icon: Package },
  { id: 'preparing', label: 'Preparing', icon: Flame },
  { id: 'brewing', label: 'Brewing', icon: Coffee },
  { id: 'ready', label: 'Ready for Pickup', icon: Clock },
];

const OrderStatusStepper = ({ currentStatus }) => {
  // Determine internal index
  const statusOrder = ['new', 'preparing', 'brewing', 'ready', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentStatus === 'completed') {
    return (
      <div className="text-center" style={{ padding: '20px', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-lg)' }}>
        <Check size={48} color="var(--color-success)" style={{ marginBottom: '12px' }} />
        <h3 style={{ color: 'var(--color-success)' }}>Order Completed</h3>
        <p style={{ fontSize: 'var(--text-sm)' }}>We hope you enjoy your brew!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {steps.map((step, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step.id} style={{ display: 'flex', gap: '16px', minHeight: '60px' }}>
            {/* Lead Line & Icon Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div 
                animate={{ 
                  backgroundColor: isPast || isCurrent ? 'var(--color-mocha)' : 'var(--border-medium)',
                  scale: isCurrent ? 1.2 : 1 
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPast || isCurrent ? 'white' : 'var(--text-muted)',
                  zIndex: 2
                }}
              >
                {isPast ? <Check size={18} /> : <step.icon size={18} />}
              </motion.div>
              
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  width: '2px',
                  backgroundColor: isPast ? 'var(--color-mocha)' : 'var(--border-light)',
                  margin: '4px 0'
                }} />
              )}
            </div>

            {/* Label Content */}
            <div style={{ paddingTop: '4px' }}>
              <p style={{ 
                fontWeight: isCurrent ? 'bold' : '500', 
                fontSize: 'var(--text-sm)',
                color: isFuture ? 'var(--text-muted)' : 'var(--color-espresso)'
              }}>
                {step.label}
              </p>
              {isCurrent && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--color-mocha)', marginTop: '2px' }}
                >
                  Our baristas are on it...
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
