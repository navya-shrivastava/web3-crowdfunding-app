'use client';
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { client } from "./client";
import { baseSepolia } from "thirdweb/chains";
import { getContract } from "thirdweb";
import { CampaignCard } from "@/components/CampaignCard";
import { CROWDFUNDING_FACTORY } from "@/app/constants/contracts";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const carouselItems = [
  {
    title: "Save Lives Today",
    description: "Help fund critical medical treatments for those who can't afford them",
    imageSrc: "images/carousel/save_lives.png"
  },
  {
    title: "Feed the Hungry",
    description: "Support food banks and meal programs for vulnerable communities",
    imageSrc: "images/carousel/feed_the_hungry.png"
  },
  {
    title: "Children's Emergency Fund",
    description: "Provide shelter, care, and support for children in crisis",
    imageSrc: "images/carousel/children.png"
  },
  {
    title: "Disaster Relief",
    description: "Deliver immediate aid to communities affected by natural disasters",
    imageSrc: "images/carousel/disaster_relief.png"
  }
];

export default function Home() {
  const router = useRouter();
  const account = useActiveAccount();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const contract = getContract({
    client: client,
    chain: baseSepolia,
    address: CROWDFUNDING_FACTORY,
  });

  const {data: campaigns, isLoading: isLoadingCampaigns} = useReadContract({
    contract: contract,
    method: "function getAllCampaigns() view returns ((address campaignAddress, address owner, string name)[])",
    params: []
  });

  const handleStartCampaign = () => {
    if (!account || !account.address) {
      alert("Please connect your wallet first");
      return;
    }
    router.push(`/dashboard/${account.address}`);
  };

  const handleLearnMore = () => {
    document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 mt-4 sm:px-6 lg:px-8">
      {/* Section with Carousel */}
      <div className="relative h-[400px] overflow-hidden rounded-xl mb-8">
        {/* Carousel */}
        <div className="relative h-full">
          {carouselItems.map((item, index) => (
            <div
              key={index}
              className={`absolute w-full h-full transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={item.imageSrc}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white">
                <h2 className="text-4xl font-bold mb-4">{item.title}</h2>
                <p className="text-xl mb-8">{item.description}</p>
                <div className="flex gap-4">
                  <button
                    onClick={handleStartCampaign}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start a Campaign
                  </button>
                  <button
                    onClick={handleLearnMore}
                    className="border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Carousel Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="py-10">
        <h1 className="text-4xl font-bold mb-4">Campaigns:</h1>
        <div className="grid grid-cols-3 gap-4">
          {!isLoadingCampaigns && campaigns && (
            campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.campaignAddress}
                  campaignAddress={campaign.campaignAddress}
                />
              ))
            ) : (
              <p>No Campaigns</p>
            )
          )}
        </div>
      </div>

      <div id="about-section" className="max-w-4xl mx-auto px-4 py-16 mt-8">
        <h2 className="text-2xl font-bold mb-6">About This Platform</h2>
        <div className="prose max-w-none">
          <p className="mb-4">
            This decentralised crowdfunding platform leverages blockchain technology to ensure transparent, secure, and efficient fundraising for charitable causes. It enables direct transactions between donors and fundraisers without intermediaries. Every transaction is permanently recorded on the blockchain, providing complete transparency and accountability.
          </p>
          <p>
            The platform utilises smart contracts to automate and secure the fundraising process, ensuring that funds are properly managed and distributed according to predetermined conditions. This technology-driven approach eliminates traditional barriers and costs associated with charitable giving while maintaining the highest standards of security and transparency.
          </p>
        </div>
      </div>
    </main>
  );
}