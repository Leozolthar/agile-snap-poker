import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Zap, BarChart3, Shield } from "lucide-react";
import heroImage from "@/assets/hero-planning-poker.jpg";
import { ThemeToggle } from "@/components/theme-toggle";

const Home = () => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    // Generate a random room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${newRoomCode}?name=${encodeURIComponent(playerName)}&moderator=true`);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) return;
    navigate(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Bring your agile team together for seamless estimation sessions"
    },
    {
      icon: Zap,
      title: "Real-time Voting",
      description: "Instant synchronization across all team members' devices"
    },
    {
      icon: BarChart3,
      title: "Vote Analytics",
      description: "Clear visualization of estimation results and team consensus"
    },
    {
      icon: Shield,
      title: "Anonymous Voting",
      description: "Hidden votes until reveal to prevent bias and anchoring"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-background to-muted/30">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-5" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                Planning Poker
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Streamline your agile estimation sessions with our modern, intuitive Planning Poker tool. 
                Perfect for remote and in-person teams.
              </p>
            </div>
            <div className="relative animate-slide-up">
              <img 
                src="/lovable-uploads/d0bf1c6a-0bce-4a6b-ad1a-4a0663a71b5b.png" 
                alt="Planning Poker Hero" 
                className="rounded-2xl shadow-2xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Planning Poker?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <feature.icon className="w-12 h-12 mx-auto text-primary mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Room Management Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-xl glass-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join the Session</CardTitle>
              <CardDescription>Create a new room or join an existing estimation session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="playerName" className="text-sm font-medium">Your Name</label>
                  <Input
                    id="playerName"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="text-center"
                  />
                </div>

                <Tabs defaultValue="create" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create Room</TabsTrigger>
                    <TabsTrigger value="join">Join Room</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="create" className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Create a new estimation session and invite your team
                    </p>
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-full"
                      onClick={handleCreateRoom}
                      disabled={!playerName.trim()}
                    >
                      Create New Room
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="join" className="space-y-4">
                    <div className="space-y-3">
                      <label htmlFor="roomCode" className="text-sm font-medium">Room Code</label>
                      <Input
                        id="roomCode"
                        placeholder="Enter room code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="text-center uppercase tracking-wider"
                        maxLength={6}
                      />
                    </div>
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full"
                      onClick={handleJoinRoom}
                      disabled={!roomCode.trim() || !playerName.trim()}
                    >
                      Join Room
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-muted-foreground">
        <div className="container mx-auto max-w-6xl">
          <p>&copy; 2024 Planning Poker. Built for agile teams worldwide.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;