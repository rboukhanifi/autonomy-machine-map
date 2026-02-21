import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanies, createCompany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const companies = getAllCompanies();
  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.category || !body.one_liner || !body.contact_email) {
      return NextResponse.json(
        { error: 'Name, category, one-liner, and contact email are required.' },
        { status: 400 }
      );
    }

    const id = createCompany(body);
    return NextResponse.json({ id, message: 'Company created successfully' }, { status: 201 });
  } catch (err) {
    console.error('Error creating company:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
