import { useState, useEffect } from "react";
import { ActionPanel, Detail, List, Action, Icon, Color } from "@raycast/api";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { formatDate, isDateInRange, groupByDate } from "./utils";
import { getConfig } from "./config";

// Using types directly from @notionhq/client package

// Get configuration from Raycast preferences
const { notionApiKey, notionDatabaseId } = getConfig();

// Initialize Notion client with the API key from preferences
const notion = new Client({
  auth: notionApiKey,
});

export interface Employee {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  notionUrl: string;
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

        const employeeData = response.results
          .filter((page): page is PageObjectResponse => "properties" in page)
          .map((page) => {
            const properties = page.properties;

            return {
              id: page.id,
              name:
                properties["Employee Name"]?.type === "title"
                  ? properties["Employee Name"].title[0]?.plain_text || "Unnamed"
                  : "Unnamed",
              startDate: properties["Start Date"]?.type === "date" ? properties["Start Date"].date?.start || "" : "",
              endDate: properties["End Date"]?.type === "date" ? properties["End Date"].date?.start || "" : "",
              status:
                properties["Status"]?.type === "status" ? properties["Status"].status?.name || "Unknown" : "Unknown",
              reason:
                properties["Reason"]?.type === "rich_text" ? properties["Reason"].rich_text[0]?.plain_text || "" : "",
              notionUrl: page.url || "",
            };
          });

        // Extra filter to ensure no rejected entries
        const filteredData = employeeData.filter((employee) => employee.status !== "Rejected");
        setEmployees(filteredData);
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
    return <List isLoading={true} searchBarPlaceholder="Search employees on leave..." />;
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

  // Group upcoming leaves by start date
  const upcomingLeaves = employees
    .filter((employee) => new Date(employee.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const groupedUpcomingLeaves = groupByDate(upcomingLeaves);

  return (
    <List searchBarPlaceholder="Search employees on leave...">
      {employeesOnLeaveToday.length > 0 ? (
        <List.Section title="📅 Employees On Leave Today">
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
                        actions={
                          <ActionPanel>
                            <Action.OpenInBrowser title="Open in Notion" url={employee.notionUrl} />
                          </ActionPanel>
                        }
                      />
                    }
                  />
                  <Action.OpenInBrowser title="Open in Notion" url={employee.notionUrl} />
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

      {Object.entries(groupedUpcomingLeaves).map(([date, employees]) => (
        <List.Section key={date} title={`📆 Upcoming: ${date}`}>
          {employees.map((employee) => (
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
                        actions={
                          <ActionPanel>
                            <Action.OpenInBrowser title="Open in Notion" url={employee.notionUrl} />
                          </ActionPanel>
                        }
                      />
                    }
                  />
                  <Action.OpenInBrowser title="Open in Notion" url={employee.notionUrl} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
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
