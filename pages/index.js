import dynamic from 'next/dynamic';

const NeurologyResidencyHub = dynamic(() => import('../src/neurology_residency_hub'), {
  ssr: false
});

export default function Home() {
  return <NeurologyResidencyHub />;
}