import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tag, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LabelFilterPopoverProps {
  selectedLabels: string[];
  onSelect: (labels: string[]) => void;
}

interface LabelData {
  name: string;
  color: string;
}

const LabelFilterPopover: React.FC<LabelFilterPopoverProps> = ({ selectedLabels, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [availableLabels, setAvailableLabels] = useState<LabelData[]>(() => {
    const saved = localStorage.getItem('kario-labels');
    return saved ? JSON.parse(saved) : [];
  });

  const presetLabels: LabelData[] = [
    { name: '#ByKairo', color: 'text-blue-500' },
    { name: '#School', color: 'text-green-500' },
    { name: '#Work', color: 'text-orange-500' },
    { name: '#Personal', color: 'text-pink-500' },
    { name: '#Urgent', color: 'text-red-500' },
    { name: '#Shopping', color: 'text-cyan-500' },
    { name: '#Health', color: 'text-emerald-500' },
    { name: '#Finance', color: 'text-amber-500' },
    { name: '#Family', color: 'text-rose-500' },
    { name: '#Projects', color: 'text-teal-500' },
  ];

  const filteredCustom = useMemo(() => {
    return availableLabels.filter(l =>
      l.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [availableLabels, searchInput]);

  const filteredPreset = useMemo(() => {
    return presetLabels.filter(l =>
      l.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput]);

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onSelect(selectedLabels.filter(l => l !== label));
    } else {
      onSelect([...selectedLabels, label]);
    }
  };

  const clearAll = () => {
    onSelect([]);
  };

  const getLabelColor = (labelName: string): string => {
    const custom = availableLabels.find(l => l.name === labelName);
    if (custom) return custom.color;

    const preset = presetLabels.find(l => l.name === labelName);
    return preset?.color || 'text-gray-400';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-gray-400 hover:text-white hover:border hover:border-[#252232] hover:bg-[#1e1e1f] hover:rounded-[8px] px-3 py-1 h-8 whitespace-nowrap transition-all duration-200 border border-transparent",
            selectedLabels.length > 0 && "text-white border-[#252232] bg-[#1e1e1f] rounded-[8px]"
          )}
        >
          <Tag className="h-4 w-4 mr-2" />
          {selectedLabels.length > 0 ? `${selectedLabels.length} Label` : 'Label'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 bg-[#1b1b1b] border border-[#414141] rounded-[12px] overflow-hidden flex flex-col"
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[400px]">
          {/* Search Input */}
          <div className="p-3 border-b border-[#414141]">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search label..."
              className="bg-[#252525] border border-[#414141] text-white placeholder-gray-500 focus:border-[#525252]"
            />
          </div>

          {/* Labels List */}
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {/* Custom Labels */}
            {availableLabels.length > 0 && filteredCustom.length > 0 && (
              <>
                <div className="text-xs text-gray-500 mb-2 px-1">Custom</div>
                {filteredCustom.map((label) => (
                  <button
                    key={label.name}
                    onClick={() => toggleLabel(label.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-[10px] transition-all text-sm flex items-center gap-2 border",
                      selectedLabels.includes(label.name)
                        ? "bg-[#2e2e2e] border-[#525252] text-white"
                        : "bg-[#252525] border-[#414141] text-gray-300 hover:bg-[#2a2a2a]"
                    )}
                  >
                    <Tag className={cn("h-3.5 w-3.5", label.color)} />
                    <span className="flex-1">{label.name}</span>
                    {selectedLabels.includes(label.name) && (
                      <span className="text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Preset Labels */}
            {filteredPreset.length > 0 && (
              <>
                {availableLabels.length > 0 && filteredCustom.length > 0 && (
                  <div className="border-t border-[#414141] my-2"></div>
                )}
                <div className="text-xs text-gray-500 mb-2 px-1">Preset</div>
                {filteredPreset.map((label) => (
                  <button
                    key={label.name}
                    onClick={() => toggleLabel(label.name)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-[10px] transition-all text-sm flex items-center gap-2 border",
                      selectedLabels.includes(label.name)
                        ? "bg-[#2e2e2e] border-[#525252] text-white"
                        : "bg-[#252525] border-[#414141] text-gray-300 hover:bg-[#2a2a2a]"
                    )}
                  >
                    <Tag className={cn("h-3.5 w-3.5", label.color)} />
                    <span className="flex-1">{label.name}</span>
                    {selectedLabels.includes(label.name) && (
                      <span className="text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </>
            )}

            {filteredCustom.length === 0 && filteredPreset.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No labels found
              </div>
            )}
          </div>

          {/* Clear Button */}
          {selectedLabels.length > 0 && (
            <div className="p-3 border-t border-[#414141]">
              <Button
                onClick={clearAll}
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-[#414141] rounded-[8px] text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LabelFilterPopover;
