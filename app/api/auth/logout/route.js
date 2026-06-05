import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Muvaffaqiyatli chiqildi' },
    { status: 200 }
  );

  response.cookies.delete('auth_token');

  return response;
}
