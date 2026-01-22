import React, { useEffect, useState } from "react";
import { editQuestById } from "../../services/questsServices";
import CodeEditor from "../Layout/CodeEditor";
import Modal from "../Layout/Modal";
import { checkValidToken } from "../../services/authService";


const EditQuestPage = ({ questId, onBack }) => {
  const [formData, setFormData] = useState({
    quest_name: "",
    quest_language: "",
    quest_difficulty: "",
    quest_condition: "",
    function_template: "",
    example_solution: "",
    // Dynamically create input/output fields
    ...Object.fromEntries([...Array(10)].map((_, i) => [`input_${i}`, ""])),
    ...Object.fromEntries([...Array(10)].map((_, i) => [`output_${i}`, ""])),
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");
  const QUESTS_API = import.meta.env.VITE_QUESTS_SERVICE_URL;

  useEffect(() => {
    const fetchQuest = async () => {
      try {
        const data = await editQuestById(questId);
        const fetchedData = {
          quest_name: data.quest_name || "",
          quest_language: data.language || "",
          quest_difficulty: data.difficulty || "",
          quest_condition: data.condition || "",
          function_template: data.function_template || "",
          example_solution: data.example_solution || "",
        };

        for (let i = 0; i < 10; i++) {
          fetchedData[`input_${i}`] = data[`input_${i}`] || "";
          fetchedData[`output_${i}`] = data[`output_${i}`] || "";
        }

        setFormData(fetchedData);
      } catch (error) {
        console.error("Error fetching quest:", error);
        setMessage("Failed to load quest.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [questId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        language: formData.quest_language,
        difficulty: formData.quest_difficulty,
        quest_name: formData.quest_name,
        quest_author: userId,
        condition: formData.quest_condition,
        example_solution: formData.example_solution,
        function_template: formData.function_template,
        type: "Basic",
      };

      for (let i = 0; i < 10; i++) {
        payload[`input_${i}`] = formData[`input_${i}`] || "";
        payload[`output_${i}`] = formData[`output_${i}`] || "";
      }

      const response = await fetch(`${QUESTS_API}/quests/${questId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const isTokenValid = await checkValidToken(response.status);

      if (isTokenValid) {
        const data = await response.json();

        if (response.ok) {
          sessionStorage.setItem("questUpdateMessage", "Quest updated successfully!");
          window.location.href = "/admin";
        } else {
          setModalMessage("Failed to update quest.");
          setModalOpen(true);
        }
      } else {
        setModalMessage("Failed to update quest.");
        setModalOpen(true);
      }
    } catch (error) {
      setModalMessage("An error occurred.");
      setModalOpen(true);
    }

    setSubmitting(false);
  };

  if (loading) return <div>Loading quest...</div>;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="px-4 py-2 rounded primary_button">
        ← Back to Quests
      </button>

      <h2 className="text-xl font-bold primary_text">
        Editing Quest: {formData.quest_name}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mx-auto min-h-screen p-10 primary_object"
      >
        <div className="mb-4">
          <label className="block mb-2">Quest Name:</label>
          <input
            type="text"
            name="quest_name"
            value={formData.quest_name}
            onChange={handleChange}
            className="text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Language:</label>
          <select
            name="quest_language"
            value={formData.quest_language}
            onChange={handleChange}
            className="text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Python">Python</option>
            <option value="Java">Java</option>
            <option value="CSharp">C#</option>
            <option value="JavaScript">JavaScript</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Difficulty:</label>
          <select
            name="quest_difficulty"
            value={formData.quest_difficulty}
            onChange={handleChange}
            className="text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Easy">Novice Quests</option>
            <option value="Medium">Adventurous Challenges</option>
            <option value="Hard">Epic Campaigns</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Condition:</label>
          <textarea
            name="quest_condition"
            value={formData.quest_condition}
            onChange={handleChange}
            className="text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={15}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Function Template:</label>
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

        {/* Quest Inputs and Outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Repeat this block for each test case (0 to 9) */}
          {[...Array(10)].map((_, index) => (
            <React.Fragment key={index}>
              {/* Input field */}
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor={`input_${index}`}
                  className={`text-m font-semibold ${
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
                  className={`text-m font-semibold  ${
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

        {/* Example Solution */}
        <div className="mb-4 mt-4">
          <label className="block mb-2">Example Solution:</label>
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

        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded primary_button ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? "Updating..." : "Update Quest"}
        </button>

        {message && <p className="mt-4">{message}</p>}
      </form>

      {/* Modal for Quest Edit Page */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Quest"
        message={modalMessage}
      />
    </div>
  );
};

export default EditQuestPage;