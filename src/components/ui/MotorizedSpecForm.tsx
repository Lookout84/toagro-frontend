import React, { useState } from "react";

export interface MotorizedSpecForm {
  model: string | null;
  year: string | null;
  serialNumber: string | null;
  enginePower: string | null;
  enginePowerKw: string | null;
  engineModel: string | null;
  fuelType: "DIESEL" | "GASOLINE" | "ELECTRIC" | "HYBRID" | "GAS" | null;
  fuelCapacity: string | null;
  transmission: "MANUAL" | "AUTOMATIC" | "HYDROSTATIC" | "CVT" | null;
  numberOfGears: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  weight: string | null;
  wheelbase: string | null;
  groundClearance: string | null;
  workingWidth: string | null;
  capacity: string | null;
  liftCapacity: string | null;
  threePtHitch: boolean | null;
  pto: boolean | null;
  ptoSpeed: string | null;
  frontAxle: string | null;
  rearAxle: string | null;
  frontTireSize: string | null;
  rearTireSize: string | null;
  hydraulicFlow: string | null;
  hydraulicPressure: string | null;
  grainTankCapacity: string | null;
  headerWidth: string | null;
  threshingWidth: string | null;
  cleaningArea: string | null;
  engineHours: string | null;
  mileage: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  isOperational: boolean | null;
}

export const initialMotorizedSpec: MotorizedSpecForm = {
  model: "",
  year: "",
  serialNumber: "",
  enginePower: "",
  enginePowerKw: "",
  engineModel: "",
  fuelType: null,
  fuelCapacity: "",
  transmission: null,
  numberOfGears: "",
  length: "",
  width: "",
  height: "",
  weight: "",
  wheelbase: "",
  groundClearance: "",
  workingWidth: "",
  capacity: "",
  liftCapacity: "",
  threePtHitch: false,
  pto: false,
  ptoSpeed: "",
  frontAxle: "",
  rearAxle: "",
  frontTireSize: "",
  rearTireSize: "",
  hydraulicFlow: "",
  hydraulicPressure: "",
  grainTankCapacity: "",
  headerWidth: "",
  threshingWidth: "",
  cleaningArea: "",
  engineHours: "",
  mileage: "",
  lastServiceDate: "",
  nextServiceDate: "",
  isOperational: false,
};

interface MotorizedSpecFormProps {
  isMotorized: boolean;
  motorizedSpec: MotorizedSpecForm;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

const MotorizedSpecFormComponent: React.FC<MotorizedSpecFormProps> = ({
  isMotorized,
  motorizedSpec,
  onChange,
}) => {
  const [showAdditionalSpecs, setShowAdditionalSpecs] = useState(false);

  if (!isMotorized) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Технічні характеристики (моторизована техніка)
        </h2>
        <div className="ml-auto flex items-center">
          <input
            type="checkbox"
            id="showAdditionalSpecs"
            checked={showAdditionalSpecs}
            onChange={() => setShowAdditionalSpecs(!showAdditionalSpecs)}
            className="mr-2"
          />
          <label htmlFor="showAdditionalSpecs" className="text-sm text-gray-700">
            Показати додаткові характеристики
          </label>
        </div>
      </div>
      
      {showAdditionalSpecs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Основні характеристики */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Модель *
            </label>
            <input
              type="text"
              name="model"
              value={motorizedSpec.model ?? ""}
              onChange={onChange}
              placeholder="Наприклад: МТЗ-82.1, John Deere 6155M"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Рік випуску
            </label>
            <input
              type="number"
              name="year"
              value={motorizedSpec.year ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Серійний номер
            </label>
            <input
              type="text"
              name="serialNumber"
              value={motorizedSpec.serialNumber ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Двигун і потужність */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Параметри двигуна
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Потужність двигуна (к.с.)
            </label>
            <input
              type="number"
              name="enginePower"
              value={motorizedSpec.enginePower ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Потужність двигуна (кВт)
            </label>
            <input
              type="number"
              name="enginePowerKw"
              value={motorizedSpec.enginePowerKw ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Модель двигуна
            </label>
            <input
              type="text"
              name="engineModel"
              value={motorizedSpec.engineModel ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип пального
            </label>
            <select
              name="fuelType"
              value={motorizedSpec.fuelType ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Виберіть тип пального</option>
              <option value="DIESEL">Дизель</option>
              <option value="GASOLINE">Бензин</option>
              <option value="ELECTRIC">Електро</option>
              <option value="HYBRID">Гібрид</option>
              <option value="GAS">Газ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Обʼєм паливного баку (л)
            </label>
            <input
              type="number"
              name="fuelCapacity"
              value={motorizedSpec.fuelCapacity ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Трансмісія */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Трансмісія
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип трансмісії
            </label>
            <select
              name="transmission"
              value={motorizedSpec.transmission ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Оберіть тип трансмісії</option>
              <option value="MANUAL">Механічна</option>
              <option value="AUTOMATIC">Автоматична</option>
              <option value="HYDROSTATIC">Гідростатична</option>
              <option value="CVT">CVT (безступінчаста)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Кількість передач
            </label>
            <input
              type="number"
              name="numberOfGears"
              value={motorizedSpec.numberOfGears ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Габарити */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Габарити та вага
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Довжина (мм)
            </label>
            <input
              type="number"
              name="length"
              value={motorizedSpec.length ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ширина (мм)
            </label>
            <input
              type="number"
              name="width"
              value={motorizedSpec.width ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Висота (мм)
            </label>
            <input
              type="number"
              name="height"
              value={motorizedSpec.height ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вага (кг)
            </label>
            <input
              type="number"
              name="weight"
              value={motorizedSpec.weight ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Колісна база (мм)
            </label>
            <input
              type="number"
              name="wheelbase"
              value={motorizedSpec.wheelbase ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дорожній просвіт (мм)
            </label>
            <input
              type="number"
              name="groundClearance"
              value={motorizedSpec.groundClearance ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Робочі параметри */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Робочі параметри
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Робоча ширина (мм)
            </label>
            <input
              type="number"
              name="workingWidth"
              value={motorizedSpec.workingWidth ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вантажопідйомність (кг)
            </label>
            <input
              type="number"
              name="liftCapacity"
              value={motorizedSpec.liftCapacity ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ємність (л/м³)
            </label>
            <input
              type="number"
              name="capacity"
              value={motorizedSpec.capacity ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Додаткові функції */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Додаткові функції
            </h3>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="threePtHitch"
              name="threePtHitch"
              checked={motorizedSpec.threePtHitch ?? false}
              onChange={onChange}
              className="mr-2"
            />
            <label htmlFor="threePtHitch" className="text-sm text-gray-700">
              Трьохточкове навішування
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pto"
              name="pto"
              checked={motorizedSpec.pto ?? false}
              onChange={onChange}
              className="mr-2"
            />
            <label htmlFor="pto" className="text-sm text-gray-700">
              Вал відбору потужності (ВВП)
            </label>
          </div>
          
          {/* Показуємо поле швидкості ВВП тільки якщо ВВП вибрано */}
          {motorizedSpec.pto && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Швидкість ВВП (об/хв)
              </label>
              <input
                type="number"
                name="ptoSpeed"
                value={motorizedSpec.ptoSpeed ?? ""}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
          
          {/* Додаткові параметри для комбайнів */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Параметри для комбайнів
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ємність зернового бункера (л)
            </label>
            <input
              type="number"
              name="grainTankCapacity"
              value={motorizedSpec.grainTankCapacity ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ширина жатки (м)
            </label>
            <input
              type="number"
              name="headerWidth"
              value={motorizedSpec.headerWidth ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Експлуатаційні параметри */}
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-800 mt-4 mb-2 border-b pb-1">
              Експлуатаційні параметри
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Моточаси
            </label>
            <input
              type="number"
              name="engineHours"
              value={motorizedSpec.engineHours ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пробіг (км)
            </label>
            <input
              type="number"
              name="mileage"
              value={motorizedSpec.mileage ?? ""}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MotorizedSpecFormComponent;