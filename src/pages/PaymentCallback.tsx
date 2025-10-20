import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderTrackingId = searchParams.get('OrderTrackingId');
        const transactionId = searchParams.get('transaction_id');
        const orderMerchantReference = searchParams.get('OrderMerchantReference');

        console.log('Payment callback params:', { orderTrackingId, transactionId, orderMerchantReference });

        if (!orderTrackingId) {
          setStatus('failed');
          setMessage('Invalid payment callback - missing tracking ID');
          setTimeout(() => navigate('/wallet'), 3000);
          return;
        }

        // Call the callback function to verify and process payment
        const { data, error } = await supabase.functions.invoke('pesapal-callback', {
          body: { 
            OrderTrackingId: orderTrackingId,
            transaction_id: transactionId,
            order_tracking_id: orderTrackingId,
          }
        });

        console.log('Callback response:', { data, error });

        if (error) {
          console.error('Callback error:', error);
          setStatus('pending');
          setMessage('Payment verification pending. Please check your wallet shortly.');
          setTimeout(() => navigate('/wallet'), 5000);
          return;
        }

        const paymentStatus = data?.status || 'pending';
        
        if (paymentStatus === 'success') {
          setStatus('success');
          setMessage('Payment successful! Redirecting...');
          setTimeout(() => navigate('/payment/success', { 
            state: { orderTrackingId, transactionId } 
          }), 2000);
        } else if (paymentStatus === 'failed') {
          setStatus('failed');
          setMessage('Payment failed. Redirecting...');
          setTimeout(() => navigate('/payment/failed', { 
            state: { orderTrackingId, transactionId } 
          }), 2000);
        } else {
          setStatus('pending');
          setMessage('Payment is being processed. Please check your wallet shortly.');
          setTimeout(() => navigate('/payment/pending', { 
            state: { orderTrackingId, transactionId } 
          }), 3000);
        }

      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage('Failed to verify payment. Please contact support.');
        setTimeout(() => navigate('/wallet'), 5000);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-success';
      case 'failed': return 'text-destructive';
      case 'pending': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background-dark p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Processing Payment</h1>
          <p className={`text-lg ${getStatusColor()}`}>
            {message}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Please do not close this window...
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
