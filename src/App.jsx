import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';



const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { temperature: 0.4 }
});

function AadhaarOCRApp() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [aadhaarDetails, setAadhaarDetails] = useState({ name:'', aadhaar:'', address:'' });
  const [isLoading, setIsLoading] = useState(false);


  const handleImageSelection = (event) => {

    const file = event.target.files[0];

    if (file) {
      setUploadedImage(file);
    }
  };

  const processOCR = async () => {
    if (!uploadedImage) {
      alert("Please select an Aadhaar card.");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result.split(',')[1];

      try {
        const result = await model.generateContent([
          { inlineData: { data: base64Image, mimeType: uploadedImage.type } },
          `Extract Aadhaar Number, Full Name, and Full Residential 
          Address from the Aadhaar card in this image. Return 
          only JSON like this: {\"aadhaar\": \"\", \"name\": \"\", \"address\": \"\"}`
        ]);

        const textOutput = result.response.text();
        const cleanedOutput = textOutput.replace(/```json|```/g, '').trim();

        let parsed;
        try {
          parsed = JSON.parse(cleanedOutput);
        } catch (error) {
          alert("Please check image");
          setIsLoading(false);
          return;
        }

        setAadhaarDetails({
          name: parsed.name || parsed.Name || '',
          aadhaar: parsed.aadhaar || parsed['Aadhaar Number'] || '',
          address: parsed.address || parsed.Address || ''
        });
      } 
      catch (error) {
        alert("Something went wrong.");
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(uploadedImage);
  };

  return (
    <div className="container">

      <h1>Aadhaar Scan</h1>

      <input type="file" accept="image/*" onChange={handleImageSelection} />

      <button onClick={processOCR} disabled={isLoading}>
        {isLoading ? 'Processing....' : 'Scan'}
      </button>

      <div className="form">
        <label>Full Name:</label>
        <input type="text" value={aadhaarDetails.name} readOnly />

        <label>Aadhaar Number:</label>
        <input type="text" value={aadhaarDetails.aadhaar} readOnly />
        <label>Residential Address:</label>
        <textarea value={aadhaarDetails.address} readOnly></textarea>
      </div>
    </div>
  );
}

export default AadhaarOCRApp;
