import { useState, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import useStickyState from "./stickyState";

import "./BandPlanner.css";

// Types
interface Member {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  requiredMembers: string[];
}

interface MembersSectionProps {
  members: Member[];
  availableMembers: string[];
  newMember: string;
  setNewMember: Dispatch<SetStateAction<string>>;
  addMember: () => void;
  toggleAvailable: (id: string) => void;
}

interface SongsSectionProps {
  members: Member[];
  songs: Song[];
  newSong: string;
  setNewSong: Dispatch<SetStateAction<string>>;
  selectedMembers: string[];
  setSelectedMembers: Dispatch<SetStateAction<string[]>>;
  addSong: () => void;
}

interface PlayableSectionProps {
  playableSongs: Song[];
}

const MembersSection = ({
  members,
  availableMembers,
  newMember,
  setNewMember,
  addMember,
  toggleAvailable,
}: MembersSectionProps) => {
  return (
    <div className="card">
      <h2>Band Members</h2>
      <div className="form-row">
        <input
          type="text"
          placeholder="New member"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          width='200px'
        />
        <button onClick={addMember}>Add</button>
      </div>
      <div>
        {members.map((m) => (
          <div key={m.id}>
            <label>
              <input
                type="checkbox"
                checked={availableMembers.includes(m.id)}
                onChange={() => toggleAvailable(m.id)}
              />
              {m.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const SongsSection = ({
  members,
  songs,
  newSong,
  setNewSong,
  selectedMembers,
  setSelectedMembers,
  addSong,
}: SongsSectionProps) => {
  return (
    <div className="card">
      <h2>Songs</h2>
      <div className="form-row">
        <input
          type="text"
          placeholder="Song title"
          value={newSong}
          onChange={(e) => setNewSong(e.target.value)}
          width='200px'
        />
      <button onClick={addSong}>Add Song</button>
      </div>
      <p>Required Members:</p>
      {members.map((m) => (
        <div key={m.id}>
          <label>
            <input
              type="checkbox"
              checked={selectedMembers.includes(m.id)}
              onChange={() =>
                setSelectedMembers((prev) =>
                  prev.includes(m.id)
                    ? prev.filter((id) => id !== m.id)
                    : [...prev, m.id]
                )
              }
            />
            {m.name}
          </label>
        </div>
      ))}
      <div className="song-list">
        {songs.map((song) => (
          <div key={song.id} className="song-item">
            <p>
              <strong>{song.title}</strong>
            </p>
            <p className="song-requirements">
              Needs:{" "}
              {song.requiredMembers
                .map((id) => members.find((m) => m.id === id)?.name)
                .join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlayableSection = ({ playableSongs }: PlayableSectionProps) => {
  return (
    <div className="card">
      <h2>Playable Songs</h2>
      {playableSongs.length === 0 ? (
        <p className="muted">No songs playable with current lineup.</p>
      ) : (
        <ul>
          {playableSongs.map((song) => (
            <li key={song.id}>{song.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function BandPlanner() {
  const [members, setMembers] = useStickyState<Member[]>("members", []);
  const [songs, setSongs] = useStickyState<Song[]>("songs", []);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);

  const [newMember, setNewMember] = useState<string>("");
  const [newSong, setNewSong] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const addMember = () => {
    if (!newMember.trim()) return;
    setMembers([
      ...members,
      { id: crypto.randomUUID(), name: newMember.trim() },
    ]);
    setNewMember("");
  };

  const addSong = () => {
    if (!newSong.trim()) return;
    setSongs([
      ...songs,
      {
        id: crypto.randomUUID(),
        title: newSong.trim(),
        requiredMembers: selectedMembers,
      },
    ]);
    setNewSong("");
    setSelectedMembers([]);
  };

  const toggleAvailable = (id: string) => {
    setAvailableMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const playableSongs = songs.filter((song) =>
    song.requiredMembers.every((m) => availableMembers.includes(m))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const membersSection = (
    <MembersSection
      members={members}
      availableMembers={availableMembers}
      newMember={newMember}
      setNewMember={setNewMember}
      addMember={addMember}
      toggleAvailable={toggleAvailable}
    />
  );

  const songsSection = (
    <SongsSection
      members={members}
      songs={songs}
      newSong={newSong}
      setNewSong={setNewSong}
      selectedMembers={selectedMembers}
      setSelectedMembers={setSelectedMembers}
      addSong={addSong}
    />
  );

  const playableSection = <PlayableSection playableSongs={playableSongs} />;

  const plannerGrid = (
    <div className="planner-grid">
      {membersSection}
      {songsSection}
      {playableSection}
    </div>
  );

  const exportData = () => {
    const data = { members, songs };
    const json = JSON.stringify(data, null, 2); // pretty print with 2 spaces
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "band-data.json";
    a.click();

    URL.revokeObjectURL(url); // clean up
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (data.members && data.songs) {
          setMembers(data.members);
          setSongs(data.songs);
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        console.log(err);
        alert("Failed to read JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setMembers([]);
    setSongs([]);
  };

  const buttons = (
    <div
      className="button-container"
      style={{
        display: "flex",
        gap: "1rem",
        marginTop: "1rem",
        alignContent: "center",
      }}
    >
      <button onClick={exportData} className="import-export-button">
        Export
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="import-export-button"
      >
        Import
      </button>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={importData}
        style={{ display: "none" }}
      />

      <button onClick={reset}>Reset</button>
    </div>
  );

  return (
    <div className="bigdiv">
      {plannerGrid}
      {buttons}
    </div>
  );
}
