import React from "react";

/**
 * Formats the files_docs.json data into readable text
 * @param {Object} filesData - The files_docs.json data
 * @param {string} topic - The topic to format (e.g., "Pneumonia")
 * @returns {string} - Formatted text representation
 */
export const formatSourceText = (filesData, topic) => {
  if (!filesData || !filesData[topic]) {
    return "No source data available.";
  }

  const topicData = filesData[topic];
  let formattedText = "";

  // Add title
  if (topicData.lines && topicData.lines.L1) {
    formattedText += `${topicData.lines.L1.content}\n\n`;
  }

  // Process lines
  if (topicData.lines) {
    Object.keys(topicData.lines).forEach((lineKey) => {
      const line = topicData.lines[lineKey];

      if (line.type === "Heading") {
        formattedText += `\n${line.content}\n`;
        formattedText += "─".repeat(line.content.length) + "\n";
      } else if (line.type === "Tile") {
        formattedText += `\n${line.content}\n`;
        formattedText += "=".repeat(line.content.length) + "\n";
      } else if (line.type === "Link") {
        formattedText += `${line.content}\n`;
        if (line.link) {
          formattedText += `  Link: ${line.link}\n`;
        }
      } else if (line.type === "sub_child") {
        formattedText += `  ${line.content}\n`;
        if (line.link) {
          formattedText += `    Link: ${line.link}\n`;
        }
      } else if (line.type === "None") {
        formattedText += `${line.content}\n`;
      }
    });
  }

  // Process tables
  if (topicData.Tables) {
    Object.keys(topicData.Tables).forEach((tableKey) => {
      const table = topicData.Tables[tableKey];
      if (table.title) {
        formattedText += `\n${table.title}\n`;
        formattedText += "─".repeat(table.title.length) + "\n";
      }

      if (table.content && Array.isArray(table.content)) {
        table.content.forEach((row, rowIndex) => {
          if (Array.isArray(row)) {
            formattedText += row.join(" | ") + "\n";
            if (rowIndex === 0) {
              formattedText += "─".repeat(row.join(" | ").length) + "\n";
            }
          }
        });
      }
      formattedText += "\n";
    });
  }

  return formattedText.trim();
};

/**
 * Extracts links from the files_docs.json data
 * @param {Object} filesData - The files_docs.json data
 * @param {string} topic - The topic to extract links from
 * @returns {Array} - Array of link objects with content and URL
 */
export const extractLinks = (filesData, topic) => {
  if (!filesData || !filesData[topic] || !filesData[topic].lines) {
    return [];
  }

  const links = [];
  const topicData = filesData[topic];

  Object.keys(topicData.lines).forEach((lineKey) => {
    const line = topicData.lines[lineKey];

    if (line.type === "Link" && line.link) {
      links.push({
        content: line.content,
        url: line.link,
      });
    } else if (line.type === "sub_child" && line.link) {
      links.push({
        content: line.content,
        url: line.link,
      });
    }
  });

  return links;
};

/**
 * Gets a summary of the source document
 * @param {Object} filesData - The files_docs.json data
 * @param {string} topic - The topic to summarize
 * @returns {Object} - Summary object with title, sections, and link count
 */
export const getSourceSummary = (filesData, topic) => {
  if (!filesData || !filesData[topic]) {
    return null;
  }

  const topicData = filesData[topic];
  const summary = {
    title: topicData.lines?.L1?.content || topic,
    sections: [],
    linkCount: 0,
    tableCount: 0,
  };

  // Count sections (headings)
  if (topicData.lines) {
    Object.keys(topicData.lines).forEach((lineKey) => {
      const line = topicData.lines[lineKey];
      if (line.type === "Heading") {
        summary.sections.push(line.content);
      }
      if (line.type === "Link" || (line.type === "sub_child" && line.link)) {
        summary.linkCount++;
      }
    });
  }

  // Count tables
  if (topicData.Tables) {
    summary.tableCount = Object.keys(topicData.Tables).length;
  }

  return summary;
};

/**
 * Renders the files_docs.json data as a React element tree for display with clickable links and structure.
 * @param {Object} filesData - The files_docs.json data
 * @param {string} topic - The topic to render (e.g., "Pneumonia")
 * @param {Object} sources - Optional object containing lines and tables used for highlighting
 * @returns {React.ReactNode}
 */
export const renderSourceDocument = (filesData, topic, sources = null) => {
  if (!filesData || !filesData[topic]) {
    return null;
  }
  const topicData = filesData[topic];
  const elements = [];

  // Helper for links
  const renderLink = (content, url) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      {content}
    </a>
  );

  // Helper for rendering tables
  const renderTable = (table, tableKey) => {
    if (!table.content || !Array.isArray(table.content)) {
      return null;
    }

    return (
      <div key={`table-${tableKey}`} className="my-6">
        {table.title && (
          <h4
            className="font-semibold text-lg mb-3 text-gray-800"
            dangerouslySetInnerHTML={{ __html: table.title }}
          >
            {/* {table.title} */}
          </h4>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <tbody>
              {table.content.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex === 0 ? "bg-gray-100 font-semibold" : ""}
                >
                  {row.map((cell, cellIndex) => {
                    const cellKey = `R${rowIndex + 1}C${cellIndex + 1}`;
                    const isSelected = sources?.tables?.[tableKey]?.includes(cellKey);
                    return (
                      <td
                        key={cellIndex}
                        className={`border border-gray-300 px-4 py-2 text-sm ${
                          isSelected ? "bg-yellow-100 border-yellow-400" : ""
                        }`}
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sources?.tables?.[tableKey] && sources.tables[tableKey].length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Highlighted cells:</span>{" "}
            {sources.tables[tableKey].join(", ")}
          </div>
        )}
      </div>
    );
  };

  // Create a map of tables by their "after" line
  const tablesByLine = {};
  if (topicData.Tables) {
    Object.keys(topicData.Tables).forEach((tableKey) => {
      const table = topicData.Tables[tableKey];
      if (table.after) {
        if (!tablesByLine[table.after]) {
          tablesByLine[table.after] = [];
        }
        tablesByLine[table.after].push({ table, tableKey });
      }
    });
  }

  // Render lines and insert tables at appropriate positions
  if (topicData.lines) {
    let currentList = [];
    let inList = false;
    Object.keys(topicData.lines).forEach((lineKey, idx, arr) => {
      const line = topicData.lines[lineKey];
      const isLineInSources = sources?.lines?.includes(lineKey);

      // Headings
      if (line.type === "Heading") {
        if (inList && currentList.length) {
          elements.push(<ul key={`ul-${idx}`}>{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(
          <div
            key={lineKey}
            className={`font-bold text-lg mt-4 mb-2 flex leading-[24px] ml-[-5px] mt-[-5px] ${
              isLineInSources ? "bg-yellow-100 p-2 rounded border-l-4 border-yellow-400" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: line.content }}
          />
        );
      } else if (line.type === "Tile") {
        if (inList && currentList.length) {
          elements.push(<ul key={`ul-${idx}`}>{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        elements.push(
          <div
            key={lineKey}
            className={`font-bold text-xl mt-6 text-center mb-8 ${
              isLineInSources ? "bg-yellow-100 p-2 rounded border-l-4 border-yellow-400" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: line.content }}
          />
        );
      } else if (line.type === "Link") {
        inList = true;
        currentList.push(
          <li 
            key={lineKey} 
            className={`ml-4 my-1 ${
              isLineInSources ? "bg-yellow-100 p-1 rounded border-l-2 border-yellow-400" : ""
            }`}
          >
            {renderLink(line.content.replace(/^\s*-\s*/, ""), line.link)}
          </li>
        );
      } else if (line.type === "sub_child") {
        // Indented sub-item (possibly under a link)
        currentList.push(
          <li 
            key={lineKey} 
            className={`ml-12 pl-1 my-0 list-[circle] ${
              isLineInSources ? "bg-yellow-100 p-1 rounded border-l-2 border-yellow-400" : ""
            }`}
          >
            {line.link ? (
              renderLink(line.content, line.link)
            ) : (
              <span dangerouslySetInnerHTML={{ __html: line.content }} />
            )}
          </li>
        );
      } else if (line.type === "None") {
        // If starts with dash, treat as list item
        if (/^\s*-\s*/.test(line.content)) {
          inList = true;
          currentList.push(
            <li
              key={lineKey}
              className={`ml-4 my-1 flex leading-[24px] ${
                isLineInSources ? "bg-yellow-100 p-1 rounded border-l-2 border-yellow-400" : ""
              }`}
              dangerouslySetInnerHTML={{
                __html: line.content.replace(/^\s*-\s*/, ""),
              }}
              // style={{maxHeight:"2.2rem"}}
            />
          );
        } else {
          if (inList && currentList.length) {
            elements.push(<ul key={`ul-${idx}`}>{currentList}</ul>);
            currentList = [];
            inList = false;
          }
          elements.push(
            <div
              key={lineKey}
              className={`mb-2 ${
                isLineInSources ? "bg-yellow-100 p-2 rounded border-l-4 border-yellow-400" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: line.content }}
            />
          );
        }
      }

      // Check if there are tables to insert after this line (AFTER rendering the line)
      if (tablesByLine[lineKey]) {
        // Flush current list before inserting tables
        if (inList && currentList.length) {
          elements.push(
            <ul key={`ul-before-table-${lineKey}`}>{currentList}</ul>
          );
          currentList = [];
          inList = false;
        }

        // Insert tables AFTER the current line
        tablesByLine[lineKey].forEach(({ table, tableKey }) => {
          elements.push(renderTable(table, tableKey));
        });
      }

      // If last line, flush list
      if (idx === arr.length - 1 && inList && currentList.length) {
        elements.push(<ul key={`ul-last`}>{currentList}</ul>);
      }
    });
  }

  return <div>{elements}</div>;
};

/**
 * Renders only the specific sources used to generate an answer, styled like the full document.
 * @param {Object} filesData - The files_docs.json data
 * @param {string} topic - The topic to render (e.g., "Pneumonia")
 * @param {Object} sources - Object containing lines and tables used
 * @returns {React.ReactNode}
 */
export const renderAnswerSources = (filesData, topic, sources) => {
  if (!filesData || !filesData[topic]) {
    return null;
  }

  if (!sources || (!sources.lines && !sources.tables)) {
    return null;
  }

  const topicData = filesData[topic];
  const elements = [];

  // Helper for links
  const renderLink = (content, url) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      {content}
    </a>
  );

  // Helper for rendering table cells
  const renderTableCells = (table, tableKey, selectedCells) => {
    if (!table.content || !Array.isArray(table.content)) {
      return null;
    }

    return (
      <div key={`table-${tableKey}`} className="my-6">
        {table.title && (
          <h4
            className="font-semibold text-lg mb-3 text-gray-800"
            dangerouslySetInnerHTML={{ __html: table.title }}
          >
            {/* {table.title} */}
          </h4>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <tbody>
              {table.content.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex === 0 ? "bg-gray-100 font-semibold" : ""}
                >
                  {row.map((cell, cellIndex) => {
                    const cellKey = `R${rowIndex + 1}C${cellIndex + 1}`;
                    const isSelected =
                      selectedCells && selectedCells.includes(cellKey);
                    return (
                      <td
                        key={cellIndex}
                        className={`border border-gray-300 px-4 py-2 text-sm ${
                          isSelected ? "bg-yellow-100 border-yellow-400" : ""
                        }`}
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedCells && selectedCells.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Highlighted cells:</span>{" "}
            {selectedCells.join(", ")}
          </div>
        )}
      </div>
    );
  };

  // Create a map of tables by their "after" line
  const tablesByLine = {};
  if (topicData.Tables) {
    Object.keys(topicData.Tables).forEach((tableKey) => {
      const table = topicData.Tables[tableKey];
      if (table.after && tablesByLine[table.after]) {
        tablesByLine[table.after].push({ table, tableKey });
      } else if (table.after) {
        tablesByLine[table.after] = [{ table, tableKey }];
      }
    });
  }

  // Get all line keys and sort them
  const lineKeys = topicData.lines
    ? Object.keys(topicData.lines).sort((a, b) => {
        const aNum = parseInt(a.replace("L", ""));
        const bNum = parseInt(b.replace("L", ""));
        return aNum - bNum;
      })
    : [];

  // Track if we're in a list
  let inList = false;
  let currentList = [];

  // Process lines in order
  lineKeys.forEach((lineKey, idx) => {
    const line = topicData.lines[lineKey];
    if (!line) return;

    const isLineInSources = sources.lines && sources.lines.includes(lineKey);

    // Logic to flush list before a non-list item
    const flushListIfNeeded = () => {
      if (inList && currentList.length > 0) {
        elements.push(<ul key={`ul-flush-${lineKey}`}>{currentList}</ul>);
        currentList = [];
        inList = false;
      }
    };

    if (
      line.type === "Heading" ||
      line.type === "Tile" ||
      (line.type === "None" && !/^\s*-\s*/.test(line.content))
    ) {
      flushListIfNeeded();
    }

    if (isLineInSources) {
      if (line.type === "Heading") {
        elements.push(
          <div
            key={lineKey}
            className="font-bold text-lg mt-4 mb-2"
            dangerouslySetInnerHTML={{ __html: line.content }}
          />
        );
      } else if (line.type === "Tile") {
        elements.push(
          <div
            key={lineKey}
            className="font-bold text-xl mt-6 mb-3"
            dangerouslySetInnerHTML={{ __html: line.content }}
          />
        );
      } else if (line.type === "Link") {
        inList = true;
        currentList.push(
          <li key={lineKey} className="ml-4 my-1">
            {renderLink(line.content.replace(/^\s*-\s*/, ""), line.link)}
          </li>
        );
      } else if (line.type === "sub_child") {
        inList = true; // Ensure we are in a list context
        currentList.push(
          <li key={lineKey} className="ml-10 my-1 list-[circle]">
            {line.link ? (
              renderLink(line.content, line.link)
            ) : (
              <span dangerouslySetInnerHTML={{ __html: line.content }} />
            )}
          </li>
        );
      } else if (line.type === "None") {
        if (/^\s*-\s*/.test(line.content)) {
          inList = true;
          currentList.push(
            <li
              key={lineKey}
              className="ml-4 my-1"
              dangerouslySetInnerHTML={{
                __html: line.content.replace(/^\s*-\s*/, ""),
              }}
            />
          );
        } else {
          elements.push(
            <div
              key={lineKey}
              className="mb-2"
              dangerouslySetInnerHTML={{ __html: line.content }}
            />
          );
        }
      }
    }

    // Check if there are tables to insert after this line
    if (tablesByLine[lineKey]) {
      flushListIfNeeded();

      tablesByLine[lineKey].forEach(({ table, tableKey }) => {
        if (sources.tables && sources.tables[tableKey]) {
          const selectedCells = sources.tables[tableKey];
          elements.push(renderTableCells(table, tableKey, selectedCells));
        }
      });
    }
  });

  // Final flush for any remaining list items
  if (inList && currentList.length > 0) {
    elements.push(<ul key="ul-final">{currentList}</ul>);
  }

  // If no elements were rendered, show a message
  if (elements.length === 0) {
    return null;
  }

  return <div>{elements}</div>;
};

/** 
  <a style='color: #2463eb; text-decoration: underline; margin-left: 5px; margin-right:5px' href='' target='_blank'></a> 
  **/
