import GardenClient from "@/components/GardenClient";

export default function Home() {
  return (
    <main>
      <noscript>
        <p style={{ padding: 24 }}>Stack Garden needs JavaScript and Web Audio to grow its recursive music.</p>
      </noscript>
      <GardenClient />
    </main>
  );
}
