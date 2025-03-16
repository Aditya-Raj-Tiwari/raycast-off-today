import { useState, useEffect } from "react";
import { ActionPanel, Detail, List, Action, Icon, Color } from "@raycast/api";
import { Client } from "@notionhq/client";
import { formatDate, isDateInRange } from "./utils";
import { getConfig } from "./config";

// Get configuration from Raycast preferences
const { notionApiKey, notionDatabaseId } = getConfig();

// Initialize Notion client with the API key from preferences
const notion = new Client({
  auth: notionApiKey,
});

interface Employee {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
}

export default function Command() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await notion.databases.query({
          database_id: notionDatabaseId,
          filter: {
            and: [
              {
                property: "Status",
                status: {
                  does_not_equal: "Rejected",
                },
              },
            ],
          },
        });

        const employeeData = response.results.map((page: any) => {
          const properties = page.properties;

          return {
            id: page.id,
            name: properties["Employee Name"]?.title[0]?.plain_text || "Unnamed",
            startDate: properties["Start Date"]?.date?.start || "",
            endDate: properties["End Date"]?.date?.start || "",
            status: properties["Status"]?.status?.name || "Unknown",
            reason: properties["Reason"]?.rich_text[0]?.plain_text || "",
          };
        });

        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  const today = new Date();
  const todayStr = formatDate(today);
  const employeesOnLeaveToday = employees.filter((employee) =>
    isDateInRange(todayStr, employee.startDate, employee.endDate),
  );

  // Handle when no data or loading state
  if (isLoading) {
    return <List isLoading={true} />;
  }

  // If no records in upcoming leaves and no one on leave today
  if (employees.length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Person}
          title="No leave records found"
          description="No leave data available. Check your Notion database connection and preferences."
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Setup Notion Integration" url="https://www.notion.so/my-integrations" />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const upcomingLeaves = employees
    .filter((employee) => new Date(employee.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <List>
      {employeesOnLeaveToday.length > 0 ? (
        <List.Section title="Employees On Leave Today">
          {employeesOnLeaveToday.map((employee) => (
            <List.Item
              key={employee.id}
              icon={getStatusIcon(employee.status)}
              title={employee.name}
              subtitle={`${formatDate(employee.startDate)} - ${formatDate(employee.endDate)}`}
              accessories={[{ text: employee.status }, { text: employee.reason }]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Show Details"
                    target={
                      <Detail
                        markdown={`# ${employee.name}
                        
**Status:** ${employee.status}
**Leave Period:** ${formatDate(employee.startDate)} - ${formatDate(employee.endDate)}
**Reason:** ${employee.reason}`}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView
          icon={Icon.Person}
          title="No employees on leave today"
          description="Everyone is at work today! 🎉"
        />
      )}

      {upcomingLeaves.length > 0 && (
        <List.Section title="Upcoming Leaves">
          {upcomingLeaves.map((employee) => (
            <List.Item
              key={employee.id}
              icon={getStatusIcon(employee.status)}
              title={employee.name}
              subtitle={`${formatDate(employee.startDate)} - ${formatDate(employee.endDate)}`}
              accessories={[{ text: employee.status }, { text: employee.reason }]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Show Details"
                    target={
                      <Detail
                        markdown={`# ${employee.name}
                        
**Status:** ${employee.status}
**Leave Period:** ${formatDate(employee.startDate)} - ${formatDate(employee.endDate)}
**Reason:** ${employee.reason}`}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Approved":
      return { source: Icon.CheckCircle, tintColor: Color.Green };
    case "Pending":
      return { source: Icon.Clock, tintColor: Color.Orange };
    case "Rejected":
      return { source: Icon.XmarkCircle, tintColor: Color.Red };
    default:
      return { source: Icon.Person };
  }
}
