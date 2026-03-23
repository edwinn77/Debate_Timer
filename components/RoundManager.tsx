
import React, { useState, useRef } from 'react';
import { Round, RoundType, DebateTemplate } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Play, MoveUp, MoveDown, Clock, Users, Upload } from 'lucide-react';
import debateTemplates from '../config/debateTemplates.json';

interface RoundManagerProps {
  rounds: Round[];
  setRounds: React.Dispatch<React.SetStateAction<Round[]>>;
  onStartDebate: () => void;
  competitionName: string;
  setCompetitionName: (name: string) => void;
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  onTemplateLoaded?: (id: string) => void;
}

export const RoundManager: React.FC<RoundManagerProps> = ({
  rounds,
  setRounds,
  onStartDebate,
  competitionName,
  setCompetitionName,
  backgroundImage,
  setBackgroundImage,
  onTemplateLoaded
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(4);
  const [newType, setNewType] = useState<RoundType>('NORMAL');
  const [newSpeaker, setNewSpeaker] = useState<'A' | 'B'>('A');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRound = () => {
    if (!newTitle) return;

    const round: Round = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      durationMinutes: newDuration,
      speaker: newType === 'NORMAL' ? newSpeaker : undefined
    };

    setRounds([...rounds, round]);
    setNewTitle('');
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter(r => r.id !== id));
  };

  const moveRound = (index: number, direction: 'up' | 'down') => {
    const newRounds = [...rounds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newRounds.length) {
      [newRounds[index], newRounds[targetIndex]] = [newRounds[targetIndex], newRounds[index]];
      setRounds(newRounds);
    }
  };

  const loadTemplate = () => {
    const template = (debateTemplates as DebateTemplate[]).find(t => t.id === selectedTemplate);
    if (!template) return;

    const rounds: Round[] = template.rounds.map((round, index) => ({
      id: (Date.now() + index).toString(),
      ...round
    }));

    setRounds(rounds);
    if (onTemplateLoaded) {
      onTemplateLoaded(template.id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-white">辩论设置</h2>
          <p className="text-slate-400">配置比赛详情和环节流程。</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {(debateTemplates as DebateTemplate[]).map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={loadTemplate}>加载模板</Button>
          <Button
            variant="primary"
            onClick={onStartDebate}
            disabled={rounds.length === 0}
            className="bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/20"
          >
            <Play className="w-4 h-4 mr-2" /> 开始流程
          </Button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competition Name */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <label className="block text-sm font-bold text-slate-300 mb-2">比赛名称</label>
          <input
            type="text"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            placeholder="例如：2024全国大学生辩论赛"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-2">显示在计时器顶部。</p>
        </div>

        {/* Background Image */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <label className="block text-sm font-bold text-slate-300 mb-2">计时器背景</label>

          {!backgroundImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-slate-800 transition-colors group"
            >
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-400 mb-2" />
              <span className="text-sm text-slate-400 group-hover:text-slate-200">点击上传图片</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative h-32 rounded-lg overflow-hidden border border-slate-700 group">
              <img src={backgroundImage} alt="Background Preview" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="danger" size="sm" onClick={() => setBackgroundImage(null)}>
                  <Trash2 className="w-4 h-4 mr-2" /> 移除
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Round List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" /> 环节流程
        </h3>

        <div className="space-y-3">
          {rounds.map((round, index) => (
            <div key={round.id} className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="flex flex-col items-center justify-center gap-1 w-8">
                <button
                  onClick={() => moveRound(index, 'up')}
                  disabled={index === 0}
                  className="text-slate-500 hover:text-white disabled:opacity-20"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-600">{index + 1}</span>
                <button
                  onClick={() => moveRound(index, 'down')}
                  disabled={index === rounds.length - 1}
                  className="text-slate-500 hover:text-white disabled:opacity-20"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-800 rounded-lg">
                {round.type === 'NORMAL' ? (
                  <Clock className="w-6 h-6 text-brand-400" />
                ) : (
                  <Users className="w-6 h-6 text-emerald-400" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-white">{round.title}</h3>
                <div className="flex gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    {round.type === 'NORMAL' ? '标准计时' : '自由辩论'}
                  </span>
                  <span>•</span>
                  <span>{round.durationMinutes} 分钟</span>
                  {round.speaker && (
                    <>
                      <span>•</span>
                      <span className={round.speaker === 'A' ? 'text-brand-400' : 'text-emerald-400'}>
                        {round.speaker === 'A' ? '正方' : '反方'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeRound(round.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {rounds.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              暂无环节。请加载模板或手动添加。
            </div>
          )}
        </div>
      </div>

      {/* Add New Round Form */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-500" /> 添加自定义环节
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="环节名称（例如：开篇立论）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as RoundType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="NORMAL">标准模式</option>
              <option value="CHESS">自由辩论</option>
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={newDuration}
              onChange={(e) => setNewDuration(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <span className="absolute right-3 top-2.5 text-slate-500 text-sm pointer-events-none">分钟</span>
          </div>

          <div className="md:col-span-2">
            <select
              value={newSpeaker}
              onChange={(e) => setNewSpeaker(e.target.value as 'A' | 'B')}
              disabled={newType !== 'NORMAL'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
            >
              <option value="A">正方</option>
              <option value="B">反方</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Button onClick={addRound} className="w-full" disabled={!newTitle}>添加</Button>
          </div>
        </div>
      </div>

    </div>
  );
};
