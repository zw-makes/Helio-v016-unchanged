import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Repeat, Sun, Sunrise, CalendarDays, CalendarPlus } from 'lucide-react';
import { format, addDays, nextSaturday, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate?: Date;
  onSelect: (date: Date | undefined) => void;
  onTimeSelect?: (time: string) => void;
  selectedRepeat?: string;
  onRepeatSelect?: (repeat: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelect, onTimeSelect, selectedRepeat = '', onRepeatSelect }) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    selectedDate ? format(selectedDate, "MMM dd, yyyy") : ""
  );
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDate || new Date());
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [timeInputValue, setTimeInputValue] = useState("");
  const [parsedTime, setParsedTime] = useState<{ time: string; display: string } | null>(null);
  const [showTimeConfirmation, setShowTimeConfirmation] = useState(false);
  const [confirmedTime, setConfirmedTime] = useState<string>("");
  const [repeatClicked, setRepeatClicked] = useState(false);
  const [repeatAnimating, setRepeatAnimating] = useState(false);
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(selectedDate);
  const [repeatPopoverOpen, setRepeatPopoverOpen] = useState(false);
  const [repeatOption, setRepeatOption] = useState<string>("");
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>();
  const [repeatInputValue, setRepeatInputValue] = useState("");
  const [parsedRepeat, setParsedRepeat] = useState<string | null>(null);

  const getRandomTimeMessage = (time: string) => {
    const messages = [
      `oh, at ${time}? nice :)`,
      `${time}? perfect timing!`,
      `cool, ${time} it is!`,
      `${time}? sounds good to me!`,
      `alright, ${time} then!`,
      `${time}? got it!`,
      `nice choice, ${time}!`,
      `${time}? love it!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomSaveMessage = () => {
    const messages = [
      'save?',
      'looks good?',
      'confirm?',
      'this one?',
      'lock it in?',
      'keep this?',
      'done?',
      'all set?'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleQuickSelect = (days: number | Date, buttonId: string) => {
    const date = typeof days === 'number' ? addDays(new Date(), days) : days;
    setTempSelectedDate(date);
    setInputValue(format(date, "MMM dd, yyyy"));
    setActiveButton(buttonId);
    setDisplayMonth(date);
    setShowDateConfirmation(true);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setTempSelectedDate(date);
    if (date) {
      setShowDateConfirmation(true);
    }
    setActiveButton(null);
  };

  const handleConfirmDate = () => {
    if (tempSelectedDate) {
      onSelect(tempSelectedDate);
      setInputValue(format(tempSelectedDate, "MMM dd, yyyy"));
      setShowDateConfirmation(false);
      setOpen(false);
    }
  };

  const getNextWeekend = () => {
    return nextSaturday(new Date());
  };

  const parseUserInput = (input: string): Date | null => {
    if (!input.trim()) return null;

    const currentYear = new Date().getFullYear();
    const normalizedInput = input.toLowerCase().trim();

    const patterns = [
      { regex: /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i, format: 'MMM d' },
      { regex: /^(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)$/i, format: 'd MMM' },
      { regex: /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i, format: 'MMMM d' },
      { regex: /^(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)$/i, format: 'd MMMM' },
    ];

    for (const { regex, format: dateFormat } of patterns) {
      const match = normalizedInput.match(regex);
      if (match) {
        try {
          const parsedDate = parse(normalizedInput.replace(/(\d+)(st|nd|rd|th)/i, '$1'), dateFormat, new Date());
          if (isValid(parsedDate)) {
            parsedDate.setFullYear(currentYear);
            if (parsedDate < new Date()) {
              parsedDate.setFullYear(currentYear + 1);
            }
            return parsedDate;
          }
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  };

  useEffect(() => {
    const date = parseUserInput(inputValue);
    setParsedDate(date);
    if (date) {
      setDisplayMonth(date);
    }
  }, [inputValue]);

  const handleApplySuggestion = () => {
    if (parsedDate) {
      setTempSelectedDate(parsedDate);
      setInputValue(format(parsedDate, "MMM dd, yyyy"));
      setActiveButton(null);
      setShowDateConfirmation(true);
      setParsedDate(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setActiveButton(null);
  };

  const parseTimeInput = (input: string): { time: string; display: string } | null => {
    if (!input.trim()) return null;

    const normalizedInput = input.toLowerCase().trim();

    const patterns = [
      /^(\d{1,2})[:|\s](\d{1,2})\s*(am|pm)$/i,
      /^(\d{1,2})\s*(am|pm)$/i,
      /^(\d{1,2})[:|\s](\d{1,2})$/i,
      /^(\d{1,2})$/,
    ];

    for (const pattern of patterns) {
      const match = normalizedInput.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        let minutes = match[2] && !['am', 'pm'].includes(match[2].toLowerCase()) ? parseInt(match[2]) : 0;
        let period = match[3] || (match[2] && ['am', 'pm'].includes(match[2].toLowerCase()) ? match[2] : null);

        if (period && typeof period === 'string' && (period.toLowerCase() === 'am' || period.toLowerCase() === 'pm')) {
          if (period.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
          } else if (period.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
          }
        } else {
          period = hours >= 12 ? 'PM' : 'AM';
        }

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          const displayPeriod = hours >= 12 ? 'PM' : 'AM';
          const display = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${displayPeriod}`;

          return { time: time24, display };
        }
      }
    }

    return null;
  };

  useEffect(() => {
    const time = parseTimeInput(timeInputValue);
    setParsedTime(time);
  }, [timeInputValue]);

  const handleApplyTime = () => {
    if (parsedTime) {
      setSelectedTime(parsedTime.display);
      setTimeInputValue(parsedTime.display);
      setConfirmedTime(parsedTime.display);
      setShowTimeConfirmation(true);
      setShowDateConfirmation(true);
      if (onTimeSelect) {
        onTimeSelect(parsedTime.display);
      }
    }
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInputValue(e.target.value);
  };

  const handleQuickTimeSelect = (time: string) => {
    const hours24 = parseInt(time.split(':')[0]);
    const minutes = time.split(':')[1];
    const displayHours = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const displayPeriod = hours24 >= 12 ? 'PM' : 'AM';
    const display = `${displayHours.toString().padStart(2, '0')}:${minutes} ${displayPeriod}`;

    setSelectedTime(display);
    setTimeInputValue(display);
    setParsedTime({ time, display });
    setShowDateConfirmation(true);
    if (onTimeSelect) {
      onTimeSelect(display);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-gray-400 hover:text-white hover:border hover:border-[#252232] hover:bg-[#1e1e1f] hover:rounded-[8px] px-3 py-1 h-8 whitespace-nowrap transition-all duration-200 border border-transparent",
            !selectedDate && "text-gray-400"
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {selectedDate ? format(selectedDate, "MMM dd") : "Date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] h-[600px] p-0 bg-[#1b1b1b] border border-[#414141] rounded-[12px] overflow-hidden flex flex-col"
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="flex flex-col h-full">
          {/* Date Input Field */}
          <div className="p-3">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="type a date"
              className="w-full bg-transparent text-white text-sm px-0 py-2 outline-none placeholder-gray-500 border-none"
            />
          </div>

          {/* Suggestion Buttons */}
          {parsedDate && (
            <div className="px-3 pb-3">
              <Button
                onClick={handleApplySuggestion}
                size="sm"
                className="w-full bg-[#252525] text-white hover:bg-[#2e2e2e] border border-[#414141] rounded-[10px] h-9 text-sm"
              >
                Apply: {format(parsedDate, "MMM dd, yyyy")}
              </Button>
            </div>
          )}

          {/* Quick Select Buttons */}
          <div className="p-3 grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(0, 'today')}
              className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Sun className={cn(
                "h-3.5 w-3.5 transition-all duration-200",
                activeButton === 'today' && "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
              )} />
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(1, 'tomorrow')}
              className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Sunrise className={cn(
                "h-3.5 w-3.5 transition-all duration-200",
                activeButton === 'tomorrow' && "text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
              )} />
              Tomorrow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(getNextWeekend(), 'weekend')}
              className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2 transition-all duration-200"
            >
              <CalendarDays className={cn(
                "h-3.5 w-3.5 transition-all duration-200",
                activeButton === 'weekend' && "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              )} />
              Next Weekend
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(2, 'afterday')}
              className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2 transition-all duration-200"
            >
              <CalendarPlus className={cn(
                "h-3.5 w-3.5 transition-all duration-200",
                activeButton === 'afterday' && "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
              )} />
              After Day
            </Button>
          </div>

          {/* Calendar */}
          <div className="flex-1 overflow-auto p-3">
            <Calendar
              mode="single"
              selected={tempSelectedDate}
              onSelect={handleCalendarSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              className="rounded-[8px] transition-all duration-300 ease-in-out"
            />

            {/* Date Confirmation */}
            {showDateConfirmation && tempSelectedDate && (
              <div className="mt-3 text-center">
                <button
                  onClick={handleConfirmDate}
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer underline decoration-dotted underline-offset-4 italic"
                  style={{
                    fontFamily: 'monospace',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed'
                  }}
                >
                  {getRandomSaveMessage()}
                </button>
              </div>
            )}
          </div>

          {/* Time and Repeat Buttons */}
          <div className="p-3 grid grid-cols-2 gap-2">
            <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2"
                >
                  <Clock className={cn(
                    "h-3.5 w-3.5 transition-all duration-300",
                    confirmedTime && "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                  )} />
                  {selectedTime || "Time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] h-[400px] p-0 bg-[#1b1b1b] border border-[#414141] rounded-[12px] overflow-hidden flex flex-col ml-[165px]"
                align="start"
                side="right"
                sideOffset={8}
                alignOffset={0}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex flex-col h-full">
                  {/* Time Input Field */}
                  <div className="p-3">
                    <input
                      type="text"
                      value={timeInputValue}
                      onChange={handleTimeInputChange}
                      placeholder="type a time (e.g., 3pm, 14:30)"
                      className="w-full bg-transparent text-white text-sm px-0 py-2 outline-none placeholder-gray-500 border-none"
                    />
                  </div>

                  {/* Time Suggestion Button */}
                  {parsedTime && (
                    <div className="px-3 pb-3">
                      <Button
                        onClick={handleApplyTime}
                        size="sm"
                        className="w-full bg-[#252525] text-white hover:bg-[#2e2e2e] border border-[#414141] rounded-[10px] h-9 text-sm"
                      >
                        Apply: {parsedTime.display}
                      </Button>
                    </div>
                  )}

                  {/* Quick Time Select Buttons */}
                  <div className="p-3 space-y-2 flex-1 overflow-auto">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('09:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        9:00 AM
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('12:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        12:00 PM
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('15:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        3:00 PM
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('18:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        6:00 PM
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('21:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        9:00 PM
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickTimeSelect('00:00')}
                        className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs"
                      >
                        Midnight
                      </Button>
                    </div>

                    {/* Confirmation Message */}
                    {showTimeConfirmation && confirmedTime && (
                      <div className="px-3 pt-2">
                        <p className="text-gray-400 text-sm italic text-center animate-in fade-in duration-300">
                          {getRandomTimeMessage(confirmedTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Repeat Popover */}
            <Popover open={repeatPopoverOpen} onOpenChange={setRepeatPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!repeatClicked) {
                      setRepeatClicked(true);
                      setRepeatAnimating(true);
                      setTimeout(() => setRepeatAnimating(false), 1000);
                    }
                  }}
                  className="bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#414141] rounded-[15px] h-9 text-xs flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Repeat className={cn(
                    "h-3.5 w-3.5 transition-all duration-300",
                    repeatClicked && "text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.8)]",
                    repeatAnimating && "animate-[repeatRotate_1s_linear_1]"
                  )} />
                  Repeat
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[320px] p-4 border border-[#414141] shadow-xl z-50 rounded-[20px] ml-[40px]"
                style={{ background: '#1F1F1F' }}
                align="start"
                side="right"
                sideOffset={-13}
                alignOffset={0}
              >
                <div className="space-y-4">
                  {/* Natural Language Input */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={repeatInputValue}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        setRepeatInputValue(value);

                        if (value.includes('daily') || value.includes('every day')) {
                          setParsedRepeat('daily');
                        } else if (value.includes('weekly') || value.includes('every week')) {
                          setParsedRepeat('every-week');
                        } else if (value.includes('every other day') || value.includes('every 2 days')) {
                          setParsedRepeat('every-other-day');
                        } else if (value.includes('weekday') || value.includes('mon-fri')) {
                          setParsedRepeat('weekdays');
                        } else if (value.includes('monday')) {
                          setParsedRepeat('every-monday');
                        } else if (value.includes('tuesday')) {
                          setParsedRepeat('every-tuesday');
                        } else if (value.includes('wednesday')) {
                          setParsedRepeat('every-wednesday');
                        } else if (value.includes('thursday')) {
                          setParsedRepeat('every-thursday');
                        } else if (value.includes('friday')) {
                          setParsedRepeat('every-friday');
                        } else if (value.includes('saturday')) {
                          setParsedRepeat('every-saturday');
                        } else if (value.includes('sunday')) {
                          setParsedRepeat('every-sunday');
                        } else if (value.match(/every (\d+) day/)) {
                          const match = value.match(/every (\d+) day/);
                          setParsedRepeat(`every-${match![1]}-days`);
                        } else if (value.match(/every (\d+) week/)) {
                          const match = value.match(/every (\d+) week/);
                          setParsedRepeat(`every-${match![1]}-weeks`);
                        } else {
                          setParsedRepeat(null);
                        }
                      }}
                      placeholder="Type repeat pattern (e.g., every day, every monday)"
                      className="w-full bg-transparent text-white text-sm px-0 py-2 outline-none placeholder-gray-500 border-none"
                    />
                  </div>

                  {/* Apply Suggestion Button */}
                  {parsedRepeat && (
                    <div className="pb-2">
                      <Button
                        onClick={() => {
                          setRepeatOption(parsedRepeat);
                          setRepeatClicked(true);
                          setShowDateConfirmation(true);
                          if (onRepeatSelect) {
                            onRepeatSelect(parsedRepeat);
                          }
                        }}
                        size="sm"
                        className="w-full bg-[#252525] text-white hover:bg-[#2e2e2e] border border-[#414141] rounded-[10px] h-9 text-sm"
                      >
                        Apply: {parsedRepeat.replace(/-/g, ' ')}
                      </Button>
                    </div>
                  )}

                  {/* Quick Repeat Options */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekdays', label: 'Every Weekday' },
                        { value: 'every-week', label: 'Every Week' },
                        { value: 'every-month', label: 'Every Month' },
                        { value: 'every-monday', label: 'Every Monday' },
                        { value: 'every-tuesday', label: 'Every Tuesday' },
                        { value: 'every-wednesday', label: 'Every Wednesday' },
                        { value: 'every-thursday', label: 'Every Thursday' },
                        { value: 'every-friday', label: 'Every Friday' },
                        { value: 'every-saturday', label: 'Every Saturday' },
                        { value: 'every-sunday', label: 'Every Sunday' },
                        { value: 'every-other-day', label: 'Every Other Day' },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRepeatOption(option.value);
                            setRepeatClicked(true);
                            setShowDateConfirmation(true);
                            if (onRepeatSelect) {
                              onRepeatSelect(option.value);
                            }
                          }}
                          className={cn(
                            "h-9 text-xs border border-[#414141] rounded-[12px] transition-all duration-200",
                            repeatOption === option.value
                              ? "bg-purple-400/20 text-purple-300 border-purple-400/50"
                              : "bg-[#252525] text-gray-300 hover:bg-[#2e2e2e] hover:text-white"
                          )}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Active Repeat Display & Clear */}
                  {repeatClicked && repeatOption && (
                    <div className="flex items-center justify-between p-3 bg-purple-400/10 border border-purple-400/30 rounded-[12px]">
                      <span className="text-sm text-purple-300">
                        Repeats: {repeatOption.replace(/-/g, ' ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRepeatClicked(false);
                          setRepeatOption("");
                          setRepeatEndDate(undefined);
                          setRepeatInputValue("");
                          setParsedRepeat(null);
                          if (onRepeatSelect) {
                            onRepeatSelect("");
                          }
                        }}
                        className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateSelector;
