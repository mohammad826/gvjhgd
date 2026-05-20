'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Copy, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ReferralsPage() {
  const { user } = useStore();
  const router = useRouter();

  const referralLink = `https://t.me/your_bot?start=${user?.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="p-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Refer & Earn</h1>
      </div>

      <div className="p-6 flex flex-col gap-8">
        <div className="bg-purple-600 p-8 rounded-[2.5rem] text-white text-center shadow-2xl shadow-purple-100">
          <Users className="mx-auto mb-4 w-16 h-16 opacity-50" />
          <h2 className="text-3xl font-black mb-2">Invite Friends</h2>
          <p className="text-purple-100 text-sm">Earn <span className="font-bold">10% commission</span> on all your friends' earnings for life!</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200">
            <input 
              readOnly 
              value={referralLink} 
              className="flex-1 bg-transparent border-none text-xs font-medium px-2 truncate"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-lg ml-2">How it works</h3>
          <div className="flex flex-col gap-3">
            <Step number="1" title="Share your link" desc="Send your unique referral link to your friends." />
            <Step number="2" title="Friends start earning" desc="Your friends watch ads and earn rewards." />
            <Step number="3" title="Get paid" desc="You automatically get 10% of their earnings." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}
