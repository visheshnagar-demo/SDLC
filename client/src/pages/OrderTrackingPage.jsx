import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { OrderLifecycleStepper } from "../components/orders/OrderLifecycleStepper";
import { DigitalCertificateCard } from "../components/orders/DigitalCertificateCard";
import { ordersApi, watchesApi } from "../services/api";
import { MOCK_WATCHES } from "./CatalogPage";
import { ShieldCheck, Truck, ArrowLeft, MapPin } from "lucide-react";

export const OrderTrackingPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [watch, setWatch] = useState(() => location.state?.watch || null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (id) {
          const data = await ordersApi.getOrderById(id);
          setOrder(data);
          if (data.watch_id) {
            try {
              const watchData = await watchesApi.getWatchById(data.watch_id);
              setWatch(watchData);
            } catch {
              setWatch(MOCK_WATCHES[0]);
            }
          }
        } else {
          const history = await ordersApi.getOrders();
          if (Array.isArray(history) && history.length > 0) {
            setOrder(history[0]);
            setWatch(MOCK_WATCHES[0]);
          } else {
            const defaultDemoOrder = {
              id: "ORD-99281-CH",
              order_number: "ORD-99281-CH",
              watch_id: "w-1",
              total_amount: 15000.0,
              shipping_fee: 150.0,
              shipping_tier: "Ferrari Group Armored Express",
              payment_status: "PAID",
              fulfillment_status: "COURIER_DISPATCH",
              tracking_number: "FG-709882-GEN",
              courier_name: "Ferrari Group Armored Logistics",
              handover_pin: "8492",
              certificate_url: "CERT-99281",
              created_at: new Date().toISOString(),
            };
            setOrder(defaultDemoOrder);
            setWatch(MOCK_WATCHES[0]);
          }
        }
      } catch (err) {
        console.error("Order load error, using simulated order", err);
        const defaultDemoOrder = {
          id: id || "ORD-99281-CH",
          order_number: id || "ORD-99281-CH",
          watch_id: "w-1",
          total_amount: 15000.0,
          shipping_fee: 150.0,
          shipping_tier: "Ferrari Group Armored Express",
          payment_status: "PAID",
          fulfillment_status: "COURIER_DISPATCH",
          tracking_number: "FG-709882-GEN",
          courier_name: "Ferrari Group Armored Logistics",
          handover_pin: "8492",
          certificate_url: "CERT-99281",
          created_at: new Date().toISOString(),
        };
        setOrder(defaultDemoOrder);
        setWatch(MOCK_WATCHES[0]);
      }
    };

    if (!order) {
      fetchOrderData();
    } else {
      if (!watch) setWatch(MOCK_WATCHES[0]);
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar />

      {/* Header Banner */}
      <section className="bg-[#0A0B0E] border-b border-[#232733] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#9EACB9] hover:text-[#D4AF37] transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Watch Discovery</span>
            </Link>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#F8F9FA]">
              Armored Transit &amp; Order Fulfillment
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-[#181B22] border border-[#4D4635] px-4 py-2 rounded-lg text-[#F2CA50]">
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            <span>GPS DISPATCH ACTIVE · GENEVA &rarr; NEW YORK</span>
          </div>
        </div>
      </section>

      {/* Main Tracking Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-12 gap-10 w-full">
        {/* Left Column (8 cols): Progressive Stepper & Certificate */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <OrderLifecycleStepper order={order} />

          <DigitalCertificateCard order={order} watch={watch} />
        </div>

        {/* Right Column (4 cols): Timepiece Summary & Courier Manifest */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#181B22] border border-[#232733] p-6 rounded-xl space-y-5 shadow-lg">
            <h3 className="font-serif text-lg font-semibold text-[#F8F9FA] border-b border-[#232733] pb-3">
              Acquired Timepiece Summary
            </h3>

            {/* Watch Card Detail */}
            <div className="space-y-3">
              <div className="h-44 bg-[#0A0B0E] rounded-lg border border-[#232733] overflow-hidden flex items-center justify-center p-2">
                <img
                  src={
                    watch?.image_urls?.[0] ||
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={watch?.model}
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <span className="text-xs font-mono text-[#D4AF37] font-bold uppercase">
                  {watch?.brand || "ROLEX"}
                </span>
                <h4 className="font-serif font-bold text-base text-[#F8F9FA]">
                  {watch?.model || "Submariner Date 41mm"}
                </h4>
                <div className="text-xs text-[#9EACB9] font-mono mt-0.5">
                  Ref. {watch?.reference_number || "126610LN"} · Year{" "}
                  {watch?.year_of_manufacture || 2022} · Serial{" "}
                  {watch?.serial_number || "884J921X"}
                </div>
              </div>

              <div className="pt-3 border-t border-[#232733] flex justify-between items-center text-sm font-mono">
                <span className="text-[#9EACB9] text-xs font-sans">
                  Escrow Amount
                </span>
                <strong className="text-[#F2CA50] text-lg font-bold">
                  ${(order?.total_amount || 15000).toLocaleString()} USD
                </strong>
              </div>
            </div>

            {/* Recipient Destination Card */}
            <div className="pt-4 border-t border-[#232733] space-y-2 text-xs text-[#9EACB9]">
              <div className="flex items-center gap-1.5 font-semibold text-[#F8F9FA]">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>Verified Handover Destination</span>
              </div>
              <div className="bg-[#12141A] p-3 rounded-lg border border-[#232733] leading-relaxed">
                <strong className="text-[#F8F9FA] block">Alex Mercer</strong>
                450 Park Avenue, Suite 2800
                <br />
                New York, NY 10022, United States
                <br />
                <span className="text-[11px] font-mono text-[#D4AF37]">
                  Tel: +1 (212) 555-0199
                </span>
              </div>
            </div>

            {/* Carrier Security Seal */}
            <div className="bg-[#12141A] border border-[#4D4635] p-3 rounded-lg text-xs space-y-1 text-[#9EACB9]">
              <div className="font-semibold text-[#F8F9FA] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Lloyd's of London Transit Insurance</span>
              </div>
              <div className="text-[11px]">
                Policy #LL-90214-CH · Full declared replacement value insured
                against damage, loss, or delay.
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTrackingPage;
