"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Clock, BarChart3, AlertTriangle, Target, Zap } from "lucide-react";

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

export default function NakitAkisiOgrenPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/tools/nakit-akisi" className="text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nakit Akışı — Öğren</h1>
          <p className="text-text-secondary text-sm mt-0.5">Nakit akışı yönetimi rehberi</p>
        </div>
      </div>

      {/* Video */}
      {VIDEO_URL && (
        <div className="aspect-video bg-bg-card rounded-[14px] border border-border-default overflow-hidden mb-6">
          <iframe src={VIDEO_URL} className="w-full h-full" allowFullScreen />
        </div>
      )}

      <Section icon={TrendingUp} title="Nakit Akışı Nedir?">
        <p>
          <strong>Nakit akışı (cashflow)</strong>, belirli bir dönemde işletmenize giren ve çıkan paranın takibidir. Kârlılıktan farklı olarak, paranın <em>ne zaman</em> elinize geçtiğini gösterir.
        </p>
        <p>
          DTC markalar için nakit akışı kritiktir çünkü reklam harcamanız anında çıkarken, ödeme işlemcisinden (Shopify, iyzico) gelen paranız 3-7 gün gecikebilir.
        </p>
        <p>
          Bu gecikme, kârlı bir işletmenin bile nakit sıkıntısı yaşamasına neden olabilir.
        </p>
      </Section>

      <Section icon={Target} title="EBM ve ROAS'tan Farkı Nedir?">
        <p>
          <strong>EBM/ROAS</strong> birim bazında kârlılığı ölçer — her satıştan ne kazanıyorsunuz? <strong>Nakit akışı</strong> ise toplam resmi gösterir — bu ay sonunda kasada para var mı?
        </p>
        <p>
          Harika bir ROAS&apos;ınız olabilir ama hızlı büyürken stoklara, reklama ve operasyona yatırım yaptığınız için nakit sıkışabilirsiniz. İkisi birbirini tamamlar.
        </p>
      </Section>

      <Section icon={Clock} title="Ödeme Gecikmesi Neden Önemli?">
        <p>
          Bir müşteri bugün sipariş verdiğinde Meta reklamına anında ödeme yaparsınız. Ama satış geliri ödeme işlemcinizin döngüsüne bağlıdır:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Shopify Payments: T+3 (3 iş günü)</li>
          <li>iyzico: T+7 veya haftalık toplu ödeme</li>
          <li>PayPal: Anında ama çekim 1-3 gün</li>
        </ul>
        <p>
          Bu gecikme, özellikle agresif ölçeklendirme dönemlerinde nakit açığı yaratır. Nakit akışı aracı bu boşluğu görselleştirir.
        </p>
      </Section>

      <Section icon={BarChart3} title="Meta Harcaması ve Nakit Etkisi">
        <p>
          Meta (Facebook/Instagram) reklam harcaması genellikle günlük faturalanır ve kredi kartından otomatik çekilir. Bu, en büyük ve en öngörülebilir nakit çıkışınızdır.
        </p>
        <p>
          İpucu: Meta Ads Manager&apos;dan CSV&apos;yi indirip araca yükleyerek günlük harcamanızı otomatik çekebilirsiniz.
        </p>
      </Section>

      <Section icon={Zap} title="Tahmin Nasıl Yapılır?">
        <p>
          <strong>Tahmin Modu</strong>&apos;nu açtığınızda araç, mevcut verilerinizin üzerine gelecek 30 günlük projeksiyonlar ekler:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pl-1">
          <li>Bekleyen ödemeleriniz (CSV&apos;de &quot;pending&quot; durumundakiler) otomatik dahil edilir</li>
          <li>Tahmini günlük Meta harcamasını girin → her güne eşit dağılır</li>
          <li>Tahmini günlük COGS&apos;u girin → her güne eşit dağılır</li>
          <li>Kişisel giderleriniz zaten dahildir</li>
        </ol>
        <p className="mt-2">
          Grafik, gerçekleşen verileri düz çizgiyle, tahminleri kesikli çizgiyle gösterir. &quot;Bugün&quot; çizgisi ikisini ayırır.
        </p>
      </Section>

      <Section icon={AlertTriangle} title="Sık Yapılan Hatalar">
        <ul className="list-disc list-inside space-y-1.5 pl-1">
          <li>Kârlılık ile nakit akışını karıştırmak — kârlı ama nakitsiz kalabilirsiniz</li>
          <li>Ödeme gecikmesini hesaba katmamak — geliri satış günü değil, ödeme günü sayın</li>
          <li>COGS&apos;u (ürün + kargo maliyeti) ihmal etmek — sadece reklam harcamasına odaklanmak</li>
          <li>Mevsimsel dalgalanmaları görmezden gelmek — tatil dönemleri nakit akışını bozar</li>
          <li>Kişisel giderleri dahil etmemek — gerçek nakit durumunuzu maskelemek</li>
        </ul>
      </Section>

      {/* Sticky bottom */}
      <div className="sticky bottom-0 py-4 bg-bg-main">
        <Link
          href="/tools/nakit-akisi"
          className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} />
          Araca Dön
        </Link>
      </div>
    </div>
  );
}
