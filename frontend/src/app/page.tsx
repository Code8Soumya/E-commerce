"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface Data {
  name: string;
  age: number;
}

// Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 1000,
});

export default function Page() {
  const [name, setName] = useState("example");
  const [age, setAge] = useState(0);

  useEffect(() => {
    const getData = async () => {
      try {
        // Use the custom axios instance
        const response = await axiosInstance.get<Data>("/");
        setName(response.data.name);
        setAge(response.data.age);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getData();
  }, []);

  return (
    <section className="h-screen flex flex-col gap-6 justify-center items-center">
      <h1 className="text-5xl">Name from backend</h1>
      <h1 className="text-5xl">Name: {name}</h1>
      <h1 className="text-5xl">Age: {age}</h1>
    </section>
  );
}
