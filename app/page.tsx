import dynamic from 'next/dynamic';

// Leaflet must be loaded client-side only
const JourneyMap = dynamic(() => import('@/components/JourneyMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
      <div className="text-xl animate-pulse">Loading our journey... 💕</div>
    </div>
  ),
});

export default function Home() {
  return <JourneyMap />;
}
