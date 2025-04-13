'use client';

import dynamic from 'next/dynamic';

const CheckAttendance = dynamic(() => import('@/components/CheckAttendance'), {
  ssr: false,
});

export default function CheckAttendancePage() {
  return <CheckAttendance />;
} 