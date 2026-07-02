import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { Shield, Upload, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { KycSubmission } from "../types";

export const DashboardKYC: React.FC = () => {
  const { user, submitKyc } = useOrbit();
  const [idType, setIdType] = useState("International Passport");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const kyc = user.kyc || { status: "unverified", idType: "", idNumber: "", dob: "", address: "", city: "", country: "", frontImage: "", backImage: "" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let frontUrl = frontImage;
    let backUrl = backImage;

    try {
      if (frontFile) {
        const storageRef = ref(storage, `kyc/${user.email}_${Date.now()}_front_${frontFile.name}`);
        await uploadBytes(storageRef, frontFile);
        frontUrl = await getDownloadURL(storageRef);
      }
      if (backFile) {
        const storageRef = ref(storage, `kyc/${user.email}_${Date.now()}_back_${backFile.name}`);
        await uploadBytes(storageRef, backFile);
        backUrl = await getDownloadURL(storageRef);
      }
    } catch (err) {
      console.error("Error uploading KYC documents:", err);
    }

    submitKyc({
      idType,
      idNumber,
      dob,
      address,
      city,
      country,
      frontImage: frontUrl,
      backImage: backUrl,
      status: "pending",
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-3 border-b border-orbit-border/50 pb-6">
        <Shield size={24} className="text-orbit-accent" />
        <h1 className="text-2xl font-bold text-orbit-white">Identity Verification (KYC)</h1>
      </div>

      <div className="bg-orbit-card border border-orbit-border rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-orbit-white">Verification Status</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                kyc.status === "approved" ? "bg-emerald-500/10 text-emerald-500" :
                kyc.status === "rejected" ? "bg-orbit-red/10 text-orbit-red" :
                "bg-orbit-border text-orbit-gray-text"
            }`}>
                {kyc.status === "approved" && <CheckCircle2 size={14} />}
                {kyc.status === "rejected" && <AlertTriangle size={14} />}
                {kyc.status === "approved" ? "VERIFIED" : 
                 kyc.status === "rejected" ? "REJECTED" : "UNVERIFIED"}
            </div>
        </div>

        {kyc.status === "unverified" || kyc.status === "rejected" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {kyc.status === "rejected" && (
                <div className="p-4 bg-orbit-red/10 border border-orbit-red/20 text-orbit-red text-xs rounded-lg">
                    <strong>Rejection Reason:</strong> {kyc.rejectionReason}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={idType} onChange={(e) => setIdType(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white">
                    <option>International Passport</option>
                    <option>National ID Card</option>
                    <option>Driver's License</option>
                </select>
                <input type="text" placeholder="ID Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white" />
                <input type="date" placeholder="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white" />
                <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white" />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white" />
                <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-orbit-bg border border-orbit-border rounded-lg p-2.5 text-xs text-orbit-white" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-orbit-border rounded-lg p-6 text-center text-orbit-gray-text hover:border-orbit-accent cursor-pointer block">
                    <Upload className="mx-auto mb-2" />
                    <p className="text-xs">{frontImage ? "Front Image Selected" : "Upload Front ID Image"}</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              setFrontFile(file);
                              setFrontImage(file.name);
                          }
                      }}
                    />
                </label>
                <label className="border-2 border-dashed border-orbit-border rounded-lg p-6 text-center text-orbit-gray-text hover:border-orbit-accent cursor-pointer block">
                    <Upload className="mx-auto mb-2" />
                    <p className="text-xs">{backImage ? "Back Image Selected" : "Upload Back ID Image"}</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              setBackFile(file);
                              setBackImage(file.name);
                          }
                      }}
                    />
                </label>
            </div>
            
            <button type="submit" className="w-full bg-orbit-accent text-orbit-bg font-bold p-3 rounded-lg hover:opacity-90">Submit Verification</button>
          </form>
        ) : (
            <p className="text-sm text-orbit-gray-text">Your submission is under review.</p>
        )}
      </div>
    </div>
  );
};
