import { expect } from "chai";
import { map, cloneDeep } from "lodash";
import { XMLElement } from "@xml-tools/ast";

import { UI5SemanticModel } from "@vscode-ui5/semantic-model-types";
import { buildUI5Aggregation, generateModel } from "@vscode-ui5/test-utils";

import { testSuggestionsScenario } from "../../utils";
import { aggregationSuggestions } from "../../../src/providers/elementName/aggregation";

const REAL_UI5_MODEL: UI5SemanticModel = generateModel("1.74.0");

describe("The ui5-vscode xml-views-completion", () => {
  context("aggregations", () => {
    context("applicable scenarios", () => {
      it("will suggest direct aggregations", () => {
        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            const suggestedNames = map(suggestions, _ => _.ui5Node.name);
            expect(suggestedNames).to.include.members([
              "content",
              "customHeader",
              "footer",
              "headerContent",
              "landmarkInfo",
              "subHeader"
            ]);

            const suggestedAstNode = suggestions[0].astNode as XMLElement;
            expect(suggestedAstNode.type).to.equal("XMLElement");
            expect((suggestedAstNode.parent as XMLElement).name).to.equal(
              "Page"
            );
          }
        });
      });

      it("will suggest borrowed aggregations", () => {
        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            const suggestedNames = map(suggestions, _ => _.ui5Node.name);
            expect(suggestedNames).to.include.members([
              "customData",
              "dependents",
              "dragDropConfig",
              "layoutData",
              "tooltip"
            ]);

            const suggestedAstNode = suggestions[0].astNode as XMLElement;
            expect(suggestedAstNode.type).to.equal("XMLElement");
            expect((suggestedAstNode.parent as XMLElement).name).to.equal(
              "Page"
            );
          }
        });
      });

      it("will not suggest pre-existing aggregations", () => {
        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <content></content>
              <customHeader></customHeader>
              <footer></footer>
              <⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            const suggestedNames = map(suggestions, _ => _.ui5Node.name);
            expect(suggestedNames).to.not.include.members([
              "content",
              "customHeader",
              "footer"
            ]);
          }
        });
      });

      it("will filter suggestions on prefix (true prefix)", () => {
        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <cu⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            const suggestedNames = map(suggestions, _ => _.ui5Node.name);
            expect(suggestedNames).to.include.members([
              "customData",
              "customHeader"
            ]);

            expect(suggestedNames).to.not.include.members([
              "content",
              "dependents",
              "dragDropConfig",
              "footer",
              "headerContent",
              "landmarkInfo",
              "layoutData",
              "subHeader",
              "tooltip"
            ]);
          }
        });
      });

      it("will filter suggestions on prefix (contains)", () => {
        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <Data⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            const suggestedNames = map(suggestions, _ => _.ui5Node.name);
            expect(suggestedNames).to.include.members([
              "customData",
              "layoutData"
            ]);

            expect(suggestedNames).to.not.include.members([
              "content",
              "customHeader",
              "dependents",
              "dragDropConfig",
              "footer",
              "headerContent",
              "landmarkInfo",
              "subHeader",
              "tooltip"
            ]);
          }
        });
      });
    });

    context("none applicable scenarios", () => {
      it("will not suggest on tag with xmlns prefix", () => {
        const clonedModel = cloneDeep(REAL_UI5_MODEL);
        const aggregationWithPrefix = buildUI5Aggregation({
          name: "mvc:bamba"
        });
        clonedModel.classes["sap.m.Page"].aggregations.push(
          aggregationWithPrefix
        );

        const xmlSnippet = `
          <mvc:View
            xmlns:mvc="sap.ui.core.mvc"
            xmlns="sap.m">
            <Page>
              <mvc:ba⇶
            </Page>
          </mvc:View>`;

        testSuggestionsScenario({
          model: clonedModel,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            expect(suggestions).to.be.empty;
          }
        });
      });

      it("will not suggest on top level Element", () => {
        const xmlSnippet = `<⇶`;

        testSuggestionsScenario({
          model: REAL_UI5_MODEL,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            expect(suggestions).to.be.empty;
          }
        });
      });

      it("will not suggest when the parent tag is a class which does not extend sap.ui.core.[Control|Element]", () => {
        const clonedModel = cloneDeep(REAL_UI5_MODEL);
        const dummyAggregation = buildUI5Aggregation({
          name: "dummy"
        });
        clonedModel.classes["sap.ui.core.Component"].aggregations.push(
          dummyAggregation
        );

        const xmlSnippet = `
          <mvc:View xmlns="sap.ui.core">
            <Component>
              <⇶
            </Component>
          </mvc:View>`;

        testSuggestionsScenario({
          model: clonedModel,
          xmlText: xmlSnippet,
          providers: {
            elementName: [aggregationSuggestions]
          },
          assertion: suggestions => {
            expect(suggestions).to.be.empty;
          }
        });
      });
    });
  });
});