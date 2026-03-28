import React, { useEffect, useState } from "react";
import { editQuestById } from "../../services/questsServices";
import CodeEditor from "../Layout/CodeEditor";
import Modal from "../Layout/Modal";
import { authFetch, checkValidToken } from "../../services/authService";

const EditQuestPage = ({ questId, onBack }) => {
  const [formData, setFormData] = useState({
    quest_name: "",
    quest_language: "",
    quest_difficulty: "",
    quest_condition: "",
    function_template: "",
    example_solution: "",
    status: "Active",
    ...Object.fromEntries([...Array(10)].map((_, i) => [`input_${i}`, ""])),
    ...Object.fromEntries([...Array(10)].map((_, i) => [`output_${i}`, ""])),
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const QUESTS_API = import.meta.env.VITE_QUESTS_SERVICE_URL;

  useEffect(() => {
    const fetchQuest = async () => {
      try {
        const data = await editQuestById(questId);
        const fetched = {
          quest_name: data.quest_name || "",
          quest_language: data.language || "",
          quest_difficulty: data.difficulty || "",
          quest_condition: data.condition || "",
          function_template: data.function_template || "",
          example_solution: data.example_solution || "",
          status: data.status || "Active",
        };
        for (let i = 0; i < 10; i++) {
          fetched[`input_${i}`] = data[`input_${i}`] || "";
          fetched[`output_${i}`] = data[`output_${i}`] || "";
        }
        setFormData(fetched);
      } catch (error) {
        console.error("Error fetching quest:", error);
        setModalMessage("Failed to load quest.");
        setModalOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchQuest();
  }, [questId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        language: formData.quest_language,
        difficulty: formData.quest_difficulty,
        quest_name: formData.quest_name,
        condition: formData.quest_condition,
        example_solution: formData.example_solution,
        function_template: formData.function_template,
        status: formData.status,
      };
      for (let i = 0; i < 10; i++) {
        payload[`input_${i}`] = formData[`input_${i}`] || "";
        payload[`output_${i}`] = formData[`output_${i}`] || "";
      }

      const response = await authFetch(`${QUESTS_API}/quests/${questId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const isTokenValid = await checkValidToken(response.status);
      if (!isTokenValid) return;

      if (response.ok) {
        setModalMessage("Quest updated successfully!");
        setModalOpen(true);
      } else {
        const data = await response.json();
        setModalMessage(data.error || "Failed to update quest.");
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Error updating quest:", error);
      setModalMessage("An error occurred.");
      setModalOpen(true);
    }

    setSubmitting(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (modalMessage === "Quest updated successfully!") {
      onBack();
    }
  };

  if (loading) return <div className="p-10 primary_text">Loading quest...</div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="primary_button px-4 py-2 rounded">
        ← Back to Quests
      </button>

      <h2 className="text-xl font-bold primary_text">
        Editing: {formData.quest_name}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Quest Name */}
        <div className="flex flex-col space-y-4 w-full">
          <label className="primary_object secondary_text p-2 w-full" htmlFor="quest_name">
            Quest Name
          </label>
          <input
            type="text"
            id="quest_name"
            name="quest_name"
            className="rounded-lg block w-full p-2.5 primary_text_area"
            value={formData.quest_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Language */}
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

        {/* Difficulty */}
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

        {/* Status */}
        <div className="flex flex-col space-y-4 w-full">
          <label className="primary_object secondary_text p-2 w-full" htmlFor="status">
            Status
          </label>
          <div className="flex gap-6 px-2">
            {["Active", "Inactive"].map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={formData.status === s}
                  onChange={handleChange}
                  className="accent-cyan-400"
                />
                <span className={`font-semibold text-sm ${s === "Active" ? "text-green-400" : "text-red-400"}`}>
                  {s}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="flex flex-col space-y-4 w-full">
          <label className="primary_object secondary_text p-2 w-full" htmlFor="quest_condition">
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

        {/* Test cases */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {[...Array(10)].map((_, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor={`input_${index}`}
                  className={`text-sm font-semibold ${index < 2 ? "text-red-500" : "text-cyan-400"}`}
                >
                  Input {index}{index < 2 && " (Required)"}
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
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor={`output_${index}`}
                  className={`text-sm font-semibold ${index < 2 ? "text-red-500" : "text-cyan-400"}`}
                >
                  Output {index}{index < 2 && " (Required)"}
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

        {/* Function Template */}
        <div className="flex flex-col space-y-4 w-full">
          <label className="primary_object secondary_text p-2 w-full" htmlFor="function_template">
            Function Template
          </label>
          <CodeEditor
            language={formData.quest_language}
            code={formData.function_template}
            onChange={(val) => setFormData((prev) => ({ ...prev, function_template: val }))}
          />
        </div>

        {/* Example Solution */}
        <div className="flex flex-col space-y-4 w-full">
          <label className="primary_object secondary_text p-2 w-full" htmlFor="example_solution">
            Example Solution
          </label>
          <CodeEditor
            language={formData.quest_language}
            code={formData.example_solution}
            onChange={(val) => setFormData((prev) => ({ ...prev, example_solution: val }))}
          />
        </div>

        <div className="btn-container">
          <button
            type="submit"
            disabled={submitting}
            className={`primary_button ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title="Edit Quest"
        message={modalMessage}
      />
    </div>
  );
};

export default EditQuestPage;
