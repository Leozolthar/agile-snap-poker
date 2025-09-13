
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, RefreshCw, Users, Crown, Home, Settings } from "lucide-react";
import dunkinDrink from "@/assets/dunkin-drink.jpg";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePokerRoom } from "@/hooks/use-poker-room";
import { NicknameDialog } from "@/components/nickname-dialog";

const POKER_VALUES = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "8", label: "8" },
  { value: "13", label: "13" },
  { value: "20", label: "20" },
  { value: "40", label: "40" },
  { value: "100", label: "100" },
  { value: "?", label: "?" },
  { value: "☕", label: "☕" },
];

interface Player {
  id: string;
  name: string;
  vote?: string;
  isModerator: boolean;
}

const Room = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get("name") || "Anonymous";
  const isModerator = searchParams.get("moderator") === "true";
  const { toast } = useToast();
  const [showNicknameDialog, setShowNicknameDialog] = useState(playerName === "Anonymous");

  const { players, selectedVote, votesRevealed, vote, toggleReveal, newRound } = usePokerRoom({
    roomCode: roomCode || "",
    playerName,
    isModerator,
  });

  const playersWithVotes = players.filter(p => p.vote);
  const voteDistribution = votesRevealed ? 
    POKER_VALUES.map(pv => ({
      value: pv.value,
      count: players.filter(p => p.vote === pv.value).length,
    })).filter(v => v.count > 0) : [];


  const handleVote = (value: string) => {
    const next = selectedVote === value ? null : value;
    vote(value);
    toast({ description: next === null ? "Vote removed" : `Voted ${value}` });
  };

  const handleRevealVotes = () => {
    toggleReveal();
    toast({ description: votesRevealed ? "Votes hidden" : "Votes revealed!" });
  };

  const handleNewRound = () => {
    newRound();
    toast({ description: "New round started" });
  };

  const copyRoomLink = async () => {
    const roomLink = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(roomLink);
    toast({
      description: "Room link copied to clipboard!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-background to-muted/30 p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Planning Poker Session</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Room: {roomCode}
              </Badge>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={copyRoomLink}>
                  Share Room
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNicknameDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Change Name
                </Button>
              </div>
            </div>
          </div>
          
          {isModerator && (
            <div className="flex gap-2">
              <Button 
                variant={votesRevealed ? "outline" : "success"}
                onClick={handleRevealVotes}
                className="flex items-center gap-2"
              >
                {votesRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {votesRevealed ? "Hide Votes" : "Reveal Votes"}
              </Button>
              <Button variant="outline" onClick={handleNewRound} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                New Round
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Voting Cards */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Your Vote</span>
                  {selectedVote && <Badge variant="secondary">{selectedVote}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {POKER_VALUES.map((card) => (
                    <div
                      key={card.value}
                      className={`poker-card ${selectedVote === card.value ? 'selected' : ''} ${votesRevealed && !isModerator ? 'disabled' : ''}`}
                      onClick={() => !votesRevealed && handleVote(card.value)}
                    >
                      {card.value === "☕" ? <img src={dunkinDrink} alt="Break" className="w-8 h-8 object-cover rounded" /> : card.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vote Results */}
            {votesRevealed && voteDistribution.length > 0 && (
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle>Vote Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {voteDistribution.map((vote) => (
                      <div key={vote.value} className="flex items-center gap-4">
                        <div className="poker-card !min-h-[60px] !text-lg w-16 flex-shrink-0">
                          {vote.value === "☕" ? <img src={dunkinDrink} alt="Break" className="w-5 h-5 object-cover rounded" /> : vote.value}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {vote.count} vote{vote.count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round((vote.count / playersWithVotes.length) * 100)}%
                            </span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all duration-500"
                              style={{ width: `${(vote.count / playersWithVotes.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Players Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        {player.isModerator && <Crown className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {player.vote ? (
                          <Badge variant={votesRevealed ? "default" : "secondary"}>
                            {votesRevealed ? (
                              player.vote === "☕" ? <img src={dunkinDrink} alt="Break" className="w-3 h-3 object-cover rounded" /> : player.vote
                            ) : "✓"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-sm text-muted-foreground">
                  <p className="flex justify-between">
                    <span>Voted:</span>
                    <span>{playersWithVotes.length}/{players.length}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Room Code:</strong> {roomCode}</p>
                <p><strong>Your Role:</strong> {isModerator ? "Moderator" : "Participant"}</p>
                <p><strong>Status:</strong> {votesRevealed ? "Votes Revealed" : "Voting in Progress"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NicknameDialog 
        open={showNicknameDialog}
        onClose={() => setShowNicknameDialog(false)}
        currentName={playerName}
      />
    </div>
  );
};

export default Room;