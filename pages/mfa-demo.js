import dynamic from 'next/dynamic';

const MFADemo = dynamic(() => import('../src/components/MFADemo'), {
  ssr: false
});

export default function MFADemoPage() {
  return <MFADemo />;
}