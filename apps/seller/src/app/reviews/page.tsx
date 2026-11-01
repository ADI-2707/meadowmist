import { redirect } from 'next/navigation';

export default function ReviewsRedirectPage() {
  redirect('/customers?tab=reviews');
}
