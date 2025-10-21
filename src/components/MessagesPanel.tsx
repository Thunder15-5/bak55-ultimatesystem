import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export function MessagesPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);

    try {
      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch support tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (contactsError) throw contactsError;
      if (ticketsError) throw ticketsError;

      setContacts(contactsData || []);
      setSupportTickets(ticketsData || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsResponded = async (id: string, type: "contact" | "support") => {
    setProcessing(id);

    try {
      const table = type === "contact" ? "contacts" : "support_tickets";
      const { error } = await supabase
        .from(table)
        .update({
          status: "responded",
          responded_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Marked as responded");
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const newContacts = contacts.filter((c) => c.status === "new").length;
  const newTickets = supportTickets.filter((t) => t.status === "new").length;

  return (
    <Tabs defaultValue="contacts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="contacts" className="relative">
          <Mail className="h-4 w-4 mr-2" />
          Contact Messages
          {newContacts > 0 && (
            <Badge variant="destructive" className="ml-2">
              {newContacts}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="support" className="relative">
          <MessageSquare className="h-4 w-4 mr-2" />
          Support Tickets
          {newTickets > 0 && (
            <Badge variant="destructive" className="ml-2">
              {newTickets}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contacts">
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No contact messages</p>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{contact.subject}</CardTitle>
                      <CardDescription>
                        From: {contact.name} ({contact.email})
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contact.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={contact.status === "new" ? "default" : "secondary"}>
                      {contact.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {contact.status !== "responded" && (
                      <Button
                        onClick={() => handleMarkAsResponded(contact.id, "contact")}
                        disabled={processing === contact.id}
                        variant="outline"
                      >
                        {processing === contact.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          "Mark as Responded"
                        )}
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={() =>
                        window.open(
                          `mailto:${contact.email}?subject=Re: ${encodeURIComponent(
                            contact.subject
                          )}`
                        )
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="support">
        <div className="space-y-4">
          {supportTickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No support tickets</p>
              </CardContent>
            </Card>
          ) : (
            supportTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Support Request</CardTitle>
                      <CardDescription>
                        From: {ticket.name} ({ticket.email})
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={ticket.status === "new" ? "default" : "secondary"}>
                      {ticket.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status !== "responded" && (
                      <Button
                        onClick={() => handleMarkAsResponded(ticket.id, "support")}
                        disabled={processing === ticket.id}
                        variant="outline"
                      >
                        {processing === ticket.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          "Mark as Responded"
                        )}
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={() =>
                        window.open(
                          `mailto:${ticket.email}?subject=Re: Support Request`
                        )
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
