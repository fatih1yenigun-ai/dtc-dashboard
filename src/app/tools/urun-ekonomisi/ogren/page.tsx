"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Target, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";

const VIDEO_URL = ""; // Configure: YouTube or Vimeo embed URL

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card rounded-[14px] border border-border-default p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
          <Icon size={16} className="text-accent" />
        </div>
        <h2 className="text-lg font-bold text-text-primary font-[var(--font-display)]">{title}</h2>
      </div>
      <div className="text-sm text-text-secondary leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function UrunEkonomisiOgrenPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/tools/urun-ekonomisi" className="text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Ürün Ekonomisi — Öğren</h1>
          <p className="text-text-secondary text-sm mt-0.5">Temel kavramlar ve araç kullanım rehberi</p>
        </div>
      </div>

      {/* Video */}
      {VIDEO_URL && (
        <div className="aspect-video bg-bg-card rounded-[14px] border border-border-default overflow-hidden mb-6">
          <iframe src={VIDEO_URL} className="w-full h-full" allowFullScreen />
        </div>
      )}

      <Section icon={DollarSign} title="EBM Nedir?">
        <p>
          <strong>EBM (Edinme Başına Maliyet)</strong>, bir müşteri kazanmak için reklama harcayabileceğiniz maksimum tutardır.
        </p>
        <p>
          Örnek: Ürününüzü 200₺&apos;ye satıyorsunuz. Maliyetiniz 60₺, ödeme komisyonu %4 (8₺). <br />
          Net gelir = 200 - 8 = 192₺ → Brüt kâr = 192 - 60 = 132₺. <br />
          Başabaş EBM&apos;niz <strong>132₺</strong>. Bu tutarın altında reklam harcarsanız kâr edersiniz.
        </p>
        <p>
          %20 kâr hedeflerseniz: hedef net = 200 × 0.20 = 40₺. <br />
          EBM = 132 - 40 = <strong>92₺</strong>. Reklam harcamanız 92₺&apos;nin altında kalmalı.
        </p>
      </Section>

      <Section icon={TrendingUp} title="ROAS Nedir?">
        <p>
          <strong>ROAS (Return on Ad Spend)</strong> = Satış Fiyatı ÷ EBM. Harcadığınız her 1₺ reklamdan kaç TL ciro döndüğünü gösterir.
        </p>
        <p>
          Yukarıdaki örnekte başabaş ROAS = 200 ÷ 132 = <strong>1.52</strong>. <br />
          %20 kâr hedefli ROAS = 200 ÷ 92 = <strong>2.17</strong>.
        </p>
        <div className="bg-bg-main rounded-lg p-3 mt-2">
          <p className="text-xs text-text-muted">
            🟢 ROAS ≥ 3.0 → Güçlü kâr | ⚪ 2.0 – 2.99 → Sağlıklı | 🟡 1.5 – 1.99 → Riskli | 🔴 &lt;1.5 → Zarar riski
          </p>
        </div>
      </Section>

      <Section icon={Target} title="Brüt Kâr Nasıl Hesaplanır?">
        <p>Adım adım:</p>
        <ol className="list-decimal list-inside space-y-1.5 pl-1">
          <li>Satış fiyatından ödeme komisyonunu düş → <strong>Net Fiyat</strong></li>
          <li>KDV dahilse, net fiyatı (1 + KDV oranı) ile böl</li>
          <li>Ürün maliyetini (COGS) çıkar → <strong>Brüt Kâr</strong></li>
        </ol>
        <p className="mt-2">
          Brüt kâr = reklama harcayabileceğiniz bütçe havuzu. Kâr hedefinizi düştükten sonra kalan tutar EBM&apos;nizdir.
        </p>
      </Section>

      <Section icon={BarChart3} title="Matrisi Nasıl Okumalısınız?">
        <p>
          Matristeki her satır bir paket seçeneğini temsil eder (ör. 2&apos;li, 4&apos;lü). Her sütun farklı bir kâr hedefini gösterir.
        </p>
        <p>
          <strong>Başabaş sütunu</strong> sıfır kâr noktasıdır — bu EBM&apos;nin üzerinde harcarsanız zarara girersiniz.
        </p>
        <p>
          Renk kodlaması ROAS&apos;a göre ayarlanır: yeşil hücreler güçlü kârlılığı, kırmızı hücreler zarar riskini gösterir.
        </p>
        <p>
          İpucu: Farklı paket boyutlarını karşılaştırarak hangi bundle&apos;ın reklam bütçenize en uygun olduğunu belirleyin.
        </p>
      </Section>

      <Section icon={AlertTriangle} title="Sık Yapılan Hatalar">
        <ul className="list-disc list-inside space-y-1.5 pl-1">
          <li>KDV dahil fiyatla hesap yapıp KDV&apos;yi çıkarmayı unutmak</li>
          <li>Kargo maliyetini COGS&apos;a dahil etmemek</li>
          <li>İade oranını hesaba katmamak (net geliri %5-15 düşürür)</li>
          <li>Ödeme komisyonunu görmezden gelmek (%3-5 kayıp)</li>
          <li>ROAS hedefini başabaş noktasına çok yakın tutmak (güvenlik marjı bırakmamak)</li>
        </ul>
      </Section>

      {/* Sticky bottom */}
      <div className="sticky bottom-0 py-4 bg-bg-main">
        <Link
          href="/tools/urun-ekonomisi"
          className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} />
          Araca Dön
        </Link>
      </div>
    </div>
  );
}
