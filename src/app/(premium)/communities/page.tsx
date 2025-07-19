"use client";

import React, { useState, useEffect } from "react";
import { Card } from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Badge } from "ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  communityId: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    communityId: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities");
      const data = await response.json();

      if (data.success) {
        setCommunities(data.communities);
      } else {
        toast.error(data.error || "Failed to fetch communities");
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to fetch communities");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      communityId: "",
      description: "",
    });
    setEditingCommunity(null);
  };

  const openEditDialog = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      communityId: community.communityId,
      description: community.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.communityId.trim()) {
      toast.error("Name and Community ID are required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCommunity
        ? `/api/communities/${editingCommunity.id}`
        : "/api/communities";

      const method = editingCommunity ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingCommunity ? "Community updated!" : "Community created!",
        );
        setIsDialogOpen(false);
        resetForm();
        fetchCommunities();
      } else {
        toast.error(data.error || "Failed to save community");
      }
    } catch (error) {
      console.error("Error saving community:", error);
      toast.error("Failed to save community");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (community: Community) => {
    if (!confirm(`Are you sure you want to delete "${community.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Community deleted!");
        fetchCommunities();
      } else {
        toast.error(data.error || "Failed to delete community");
      }
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Twitter Communities
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your Twitter communities for targeted posting
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCommunity ? "Edit Community" : "Add New Community"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name *</label>
                <Input
                  placeholder="e.g., Tech Enthusiasts"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Community ID *</label>
                <Input
                  placeholder="e.g., 1146654567674912769"
                  value={formData.communityId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      communityId: e.target.value,
                    }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Find this in the Twitter Community URL or settings
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional description for this community..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting
                    ? "Saving..."
                    : editingCommunity
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {communities.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Users className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No Communities Yet</h3>
              <p className="text-muted-foreground">
                Add your first Twitter community to start posting targeted
                content
              </p>
            </div>
            <Button
              onClick={openCreateDialog}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Community
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Card key={community.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{community.name}</h3>
                    {community.isActive ? (
                      <Badge
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    ID: {community.communityId}
                  </p>
                  {community.description && (
                    <p className="text-sm text-muted-foreground">
                      {community.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(community.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(community)}
                  className="flex-1 flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(community)}
                  className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
