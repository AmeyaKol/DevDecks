// client/src/components/DeckForm.jsx (New Component - Simplified)
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useFlashcardStore from "../../store/flashcardStore";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { deckSchema, deckTypes } from "../../utils/validationSchemas";

function DeckForm() {
  const { addDeck, editingDeck, updateDeckStore, cancelEditDeck } =
    useFlashcardStore();
  const isEditMode = !!editingDeck;
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "DSA",
    },
  });

  useEffect(() => {
    if (isEditMode && editingDeck) {
      reset({
        name: editingDeck.name || "",
        description: editingDeck.description || "",
        type: editingDeck.type || "DSA",
      });
    } else {
      reset({
        name: "",
        description: "",
        type: "DSA",
      });
    }
  }, [editingDeck, isEditMode, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateDeckStore(editingDeck._id, values);
      } else {
        await addDeck(values);
      }
      if (!isEditMode) {
        reset({
          name: "",
          description: "",
          type: "DSA",
        });
      }
    } catch (error) {
      // Error handled by store's modal
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 bg-gray-50 rounded-lg shadow mb-6 space-y-3"
    >
      <h3 className="text-lg font-medium">
        {isEditMode ? "Edit Deck" : "Create New Deck"}
      </h3>
      <div>
        <label
          htmlFor="deckName"
          className="block text-sm font-medium text-gray-700"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="deckName"
          {...register("name")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="deckType"
          className="block text-sm font-medium text-gray-700"
        >
          Type <span className="text-red-500">*</span>
        </label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <AnimatedDropdown
              options={deckTypes.map((deckType) => ({ value: deckType, label: deckType }))}
              value={field.value}
              onChange={(option) => field.onChange(option.value)}
              placeholder="Select deck type"
            />
          )}
        />
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="deckDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="deckDescription"
          rows="2"
          {...register("description")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isEditMode ? "Update Deck" : "Create Deck"}
        </button>
        {isEditMode && (
          <button
            type="button"
            onClick={cancelEditDeck}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
export default DeckForm;
