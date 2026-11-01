import { redirect } from 'next/navigation';

export default function PromotionsRedirectPage() {
  redirect('/marketing?tab=promotions');
}
