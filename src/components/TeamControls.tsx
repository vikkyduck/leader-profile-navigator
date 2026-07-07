import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface TeamControlsProps {
  teamId: string;
  teamMemberCount: number;
  onTeamIdChange: (teamId: string) => void;
}

const TeamControls = ({ teamId, teamMemberCount, onTeamIdChange }: TeamControlsProps) => {
  const [inputValue, setInputValue] = useState(teamId);

  const sanitizeTeamId = (id: string) => {
    return id
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 50);
  };

  const handleChange = (value: string) => {
    const sanitized = sanitizeTeamId(value);
    setInputValue(sanitized);
    onTeamIdChange(sanitized);
  };

  return (
    <div className="bg-card rounded-xl border border-border card-shadow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">ID Команды</h2>
      </div>
      
      <div>
        <Label htmlFor="teamId" className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Введите ID команды
        </Label>
        <Input
          id="teamId"
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Например: sprint-alpha"
          className="bg-background border-border focus:ring-primary rounded-lg text-sm h-9"
        />
      </div>

      {teamId ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Команда</span>
            <span className="text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-md">
              {teamId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Всего оценок</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {teamMemberCount}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Введите ID для просмотра данных команды
        </p>
      )}
    </div>
  );
};

export default TeamControls;
