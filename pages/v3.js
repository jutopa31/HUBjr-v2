import dynamic from 'next/dynamic';

const V3Hub = dynamic(() => import('../src/v3/V3Hub'), { ssr: false });

export default function V3Page() {
  return <V3Hub />;
}
