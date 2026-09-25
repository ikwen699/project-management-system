"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, Users, Layers, ArrowRight } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import type { OrgListing } from "@/types";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) =>
        setOrganizations(Array.isArray(data.organizations) ? data.organizations : [])
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="text-muted-foreground">
            Groups of teams, projects and members you collaborate with.
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Organisation
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={3} />
      ) : organizations.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>You haven&apos;t joined any organisation yet</p>
          <Link
            href="/organizations/new"
            className="mt-2 inline-block text-primary hover:underline text-sm font-medium"
          >
            Create your first organisation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{org.name}</p>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {org.memberCount} members
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> {org.teamCount} teams
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {org.myRole === "ADMIN" ? "Admin" : "Member"}
                </span>
                {org.type && <span className="text-xs">· {org.type}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}