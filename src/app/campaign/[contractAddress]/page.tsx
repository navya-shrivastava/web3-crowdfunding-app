'use client';
import { client } from "@/app/client";
import { TierCard } from "@/components/TierCard";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getContract, prepareContractCall, ThirdwebContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { lightTheme, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";

export default function CampaignPage() {
    const params = useParams();
    const contractAddress = params?.contractAddress as string;
    const account = useActiveAccount();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Error handling for missing contract address
    if (!contractAddress) {
        return <div className="mx-auto max-w-7xl px-2 mt-4">
            <p className="text-xl">Error: Campaign address not found</p>
        </div>;
    }

    const contract = getContract({
        client: client,
        chain: baseSepolia,
        address: contractAddress,
    });

    const { data: name, isLoading: isLoadingName } = useReadContract({
        contract: contract,
        method: "function name() view returns (string)",
        params: [],
    });

    const { data: description } = useReadContract({ 
        contract, 
        method: "function description() view returns (string)", 
        params: [] 
    });

    const { data: creationDate, error } = useReadContract({
        contract,
        method: "function creationDate() view returns (uint256)",
        params: [],
    });

    if (error) {
        console.error("Error fetching creationDate:", error);
    }

    console.log("Raw creationDate from contract:", creationDate);
    
    // Convert creationDate to a date
    const creationDateObject = creationDate ? new Date(parseInt(creationDate.toString()) * 1000) : null;

    const { data: deadline, isLoading: isLoadingDeadline } = useReadContract({
        contract: contract,
        method: "function deadline() view returns (uint256)",
        params: [],
    });

    // Convert deadline to a date
    const deadlineDate = deadline ? new Date(parseInt(deadline.toString()) * 1000) : null;
    // Check if deadline has passed
    const hasDeadlinePassed = deadlineDate ? deadlineDate < new Date() : false;

    const { data: goal, isLoading: isLoadingGoal } = useReadContract({
        contract: contract,
        method: "function goal() view returns (uint256)",
        params: [],
    });
    
    // Total funded balance of the campaign
    const { data: balance, isLoading: isLoadingBalance } = useReadContract({
        contract: contract,
        method: "function getContractBalance() view returns (uint256)",
        params: [],
    });

    // Calculate the total funded balance percentage
    const totalBalance = balance?.toString() || "0";
    const totalGoal = goal?.toString() || "1"; // Prevent division by zero
    let balancePercentage = (parseInt(totalBalance) / parseInt(totalGoal)) * 100;

    // If balance is greater than or equal to goal, percentage should be 100
    if (balancePercentage >= 100) {
        balancePercentage = 100;
    }

    const { data: tiers, isLoading: isLoadingTiers } = useReadContract({
        contract: contract,
        method: "function getTiers() view returns ((string name, uint256 amount, uint256 backers)[])",
        params: [],
    });

    const { data: owner, isLoading: isLoadingOwner } = useReadContract({
        contract: contract,
        method: "function owner() view returns (address)",
        params: [],
    });

    const { data: status } = useReadContract({ 
        contract, 
        method: "function state() view returns (uint8)", 
        params: [] 
    });

    // Add loading state
    if (isLoadingName || isLoadingDeadline || isLoadingGoal || isLoadingBalance || isLoadingOwner) {
        return <div className="mx-auto max-w-7xl px-2 mt-4">
            <p className="text-xl">Loading campaign details...</p>
        </div>;
    }
    
    return (
        <div className="mx-auto max-w-7xl px-2 mt-4 sm:px-6 lg:px-8">
            <div className="flex flex-row justify-between items-center">
                <p className="text-4xl font-semibold">{name || "Unnamed Campaign"}</p>
                {owner === account?.address && (
                    <div className="flex flex-row">
                        {isEditing && (
                            <p className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2">
                                Status:  
                                {status === 0 ? " Active" : 
                                status === 1 ? " Successful" :
                                status === 2 ? " Failed" : " Unknown"}
                            </p>
                        )}
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "Done" : "Edit"}
                        </button>
                    </div>
                )}
            </div>
            <div className="my-4">
                <p className="text-lg font-semibold">Description:</p>
                <p>{description || "No description available"}</p>
            </div>
            <div className="mb-4">
                <p className="text-lg font-semibold">Creation Date:</p>
                {
                creationDateObject && (
                    <p>{creationDateObject.toDateString()}</p>
                )
                }
            </div>
            <div className="mb-4">
                <p className="text-lg font-semibold">Deadline:</p>
                {
                deadlineDate && (
                    <p>{deadlineDate.toDateString()}</p>
                )
                }
            </div>
            <div className="mb-4">
                <p className="text-lg font-semibold">Campaign Goal: ${goal?.toString() || "0"}</p>
                <div className="relative w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div 
                        className="h-6 bg-blue-600 rounded-full dark:bg-blue-500 text-right" 
                        style={{ width: `${balancePercentage}%` }}
                    >
                        <p className="text-white dark:text-white text-xs p-1">${totalBalance}</p>
                    </div>
                    <p className="absolute top-0 right-0 text-white dark:text-white text-xs p-1">
                        {balancePercentage >= 100 ? "" : `${balancePercentage.toFixed(1)}%`}
                    </p>
                </div>
            </div>
            <div>
                <p className="text-lg font-semibold">Tiers:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoadingTiers ? (
                        <p>Loading...</p>
                    ) : (
                        tiers && tiers.length > 0 ? (
                            tiers.map((tier, index) => (
                                <TierCard
                                    key={index}
                                    tier={tier}
                                    index={index}
                                    contract={contract}
                                    isEditing={isEditing}
                                />
                            ))
                        ) : (
                            !isEditing && (
                                <p>No tiers available</p>
                            )
                        )
                    )}
                    {isEditing && (
                        <button
                            className="max-w-sm flex flex-col text-center justify-center items-center font-semibold p-6 bg-blue-500 text-white border border-slate-100 rounded-lg shadow"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + Add Tier
                        </button>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <CreateTierModal
                    setIsModalOpen={setIsModalOpen}
                    contract={contract}
                />
            )}
        </div>
    );
}

type CreateTierModalProps = {
    setIsModalOpen: (value: boolean) => void;
    contract: ThirdwebContract;
}

const CreateTierModal = ({ setIsModalOpen, contract }: CreateTierModalProps) => {
    const [tierName, setTierName] = useState<string>("");
    const [tierAmount, setTierAmount] = useState<bigint>(1n);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-100 p-6 rounded-md">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-semibold">Create a Funding Tier</p>
                    <button
                        className="text-sm px-4 py-2 bg-slate-600 text-white rounded-md"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Close
                    </button>
                </div>
                <div className="flex flex-col">
                    <label>Tier Name:</label>
                    <input 
                        type="text" 
                        value={tierName}
                        onChange={(e) => setTierName(e.target.value)}
                        placeholder="Tier Name"
                        className="mb-4 px-4 py-2 bg-slate-200 rounded-md"
                    />
                    <label>Tier Cost:</label>
                    <input 
                        type="number"
                        value={parseInt(tierAmount.toString())}
                        onChange={(e) => setTierAmount(BigInt(e.target.value))}
                        className="mb-4 px-4 py-2 bg-slate-200 rounded-md"
                    />
                    <TransactionButton
                        transaction={() => prepareContractCall({
                            contract: contract,
                            method: "function addTier(string _name, uint256 _amount)",
                            params: [tierName, tierAmount]
                        })}
                        onTransactionConfirmed={async () => {
                            alert("Tier added successfully!");
                            setIsModalOpen(false);
                        }}
                        onError={(error) => alert(`Error: ${error.message}`)}
                        theme={lightTheme()}
                    >
                        Add Tier
                    </TransactionButton>
                </div>
            </div>
        </div>
    );
}