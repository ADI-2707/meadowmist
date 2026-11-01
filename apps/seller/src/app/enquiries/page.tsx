import { redirect } from 'next/navigation';

export default function EnquiriesRedirectPage() {
  redirect('/customers?tab=inbox');
}
