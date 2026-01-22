import React, { useState } from "react";
import "github-markdown-css/github-markdown.css";
import CodeEditor from "../Layout/CodeEditor";
import Modal from "../Layout/Modal";
import { checkValidToken } from "../../services/authService";

const AddQuest = () => {
  const userId = localStorage.getItem("userId");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const QUEST_API = import.meta.env.VITE_QUESTS_SERVICE_URL;

  const [formData, setFormData] = useState({
    quest_name: "",
    quest_language: "",
    quest_difficulty: "",
    quest_condition: "",
    quest_inputs: "",
    quest_outputs: "",
    function_template: "",
    example_solution: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        language: formData.quest_language,
        difficulty: formData.quest_difficulty,
        quest_name: formData.quest_name,
        quest_author: userId,
        condition: formData.quest_condition,
        function_template: formData.function_template,
        example_solution: formData.example_solution,
        type: "Basic"
      };
      
      // Append each test input/output
      for (let i = 0; i < 10; i++) {
        payload[`input_${i}`] = formData[`input_${i}`] || "";
        payload[`output_${i}`] = formData[`output_${i}`] || "";
      }
      
      const response = await fetch(`${QUEST_API}/quests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const isTokenValid = await checkValidToken(response.status);

      let data = null;
      
      if (isTokenValid) {
        const data = await response.json();

        if (response.ok) {
          setModalMessage("Quest created successfully!");
          setModalOpen(true);
          // Reset form data
          setFormData({
            quest_name: "",
            quest_language: "",
            quest_difficulty: "",
            quest_condition: "",
            function_template: "",
            example_solution: "",
            ...Array.from({ length: 10 }, (_, i) => ({
              [`input_${i}`]: "",
              [`output_${i}`]: ""
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
          });
        } else {
          console.error("Error:", data.error);
          setModalMessage("Quest creation failed: " + (data.error || "Unknown error"));
          setModalOpen(true);
        }
      } else {
        console.error("Error:", data.error);
        setModalMessage("Quest creation failed: " + (data.error || "Unknown error"));
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setModalMessage("Quest creation failed: " + (error.message || "Unknown error"));
      setModalOpen(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col space-y-4 w-full">
        <label
          className="primary_object secondary_text p-2 w-full"
          htmlFor="quest_name"
        >
          Quest Name
        </label>
        <input
          type="text"
          id="quest_name"
          name="quest_name"
          className="rounded-lg block w-full p-2.5 primary_text_area"
          value={formData.quest_name}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col space-y-4 w-full">
        <select
          id="quest_language"
          name="quest_language"
          className="primary_object secondary_text p-2 w-full"
          value={formData.quest_language}
          onChange={handleChange}
        >
          <option value="">Select language</option>
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="CSharp">C#</option>
          <option value="JavaScript">JavaScript</option>
        </select>
      </div>

      <div className="flex flex-col space-y-4 w-full">
        <select
          id="quest_difficulty"
          name="quest_difficulty"
          className="primary_object secondary_text p-2 w-full"
          value={formData.quest_difficulty}
          onChange={handleChange}
        >
          <option value="">Select difficulty</option>
          <option value="Easy">Novice Quests</option>
          <option value="Medium">Adventurous Challenges</option>
          <option value="Hard">Epic Campaigns</option>
        </select>
      </div>

      {/* Quest Condition */}
      <div className="flex flex-col space-y-4 w-full">
        <label
          className="primary_object secondary_text p-2 w-full"
          htmlFor="quest_condition"
        >
          Condition
        </label>
        <textarea
          id="quest_condition"
          name="quest_condition"
          className="text-gray-900 rounded-lg block w-full p-2.5 primary_text_area"
          rows={15}
          value={formData.quest_condition}
          onChange={handleChange}
        />
      </div>

      {/* Quest Inputs and Outputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        {/* Repeat this block for each test case (0 to 9) */}
        {[...Array(10)].map((_, index) => (
          <React.Fragment key={index}>
            {/* Input field */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor={`input_${index}`}
                className={`text-sm font-semibold ${
                  index < 2 ? "text-red-500" : "text-cyan-400"
                }`}
              >
                Input {index}
                {index < 2 && " (Required)"}
              </label>
              <textarea
                id={`input_${index}`}
                name={`input_${index}`}
                rows={3}
                className="rounded-lg block w-full h-12 p-2.5 primary_text_area"
                value={formData[`input_${index}`] || ""}
                onChange={handleChange}
                required={index < 2}
              />
            </div>

            {/* Output field */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor={`output_${index}`}
                className={`text-sm font-semibold  ${
                  index < 2 ? "text-red-500" : "text-cyan-400"
                }`}
              >
                Output {index}
                {index < 2 && " (Required)"}
              </label>
              <textarea
                id={`output_${index}`}
                name={`output_${index}`}
                rows={3}
                className="rounded-lg block w-full h-12 p-2.5 primary_text_area"
                value={formData[`output_${index}`] || ""}
                onChange={handleChange}
                required={index < 2}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col space-y-4 w-full">
        <label
          className="primary_object secondary_text p-2 w-full"
          htmlFor="function_template"
        >
          Function Template
        </label>
        <CodeEditor
          language={formData.quest_language}
          code={formData.function_template}
          onChange={(val) =>
            setFormData((prev) => ({
              ...prev,
              function_template: val,
            }))
          }
        />
      </div>

      <div className="flex flex-col space-y-4 w-full">
        <label
          className="primary_object secondary_text p-2 w-full"
          htmlFor="example_solution"
        >
          Example Solution
        </label>
        <CodeEditor
          language={formData.quest_language}
          code={formData.example_solution}
          onChange={(val) =>
            setFormData((prev) => ({
              ...prev,
              example_solution: val,
            }))
          }
        />
      </div>

      <div className="btn-container">
        <button type="submit" className="primary_button">
          Submit Quest
        </button>
      </div>
      {/* Modal for create new quest */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Quest"
        message={modalMessage}
      />
    </form>
  );
};

export default AddQuest;