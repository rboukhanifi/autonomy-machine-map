import { NextResponse } from 'next/server';
import { getAllCompanies } from '@/lib/db';

export async function GET() {
  const companies = getAllCompanies();
  return NextResponse.json(companies);
}
