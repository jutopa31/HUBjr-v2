import dynamic from 'next/dynamic';

const useV3 = process.env.NEXT_PUBLIC_HUBJR_USE_V3 === 'true';

const NeurologyResidencyHub = dynamic(
  () =>
    useV3
      ? import('../src/neurology_residency_hub_v3')
      : import('../src/neurology_residency_hub'),
  { ssr: false }
);

export default function Home() {
  return <NeurologyResidencyHub />;
}
