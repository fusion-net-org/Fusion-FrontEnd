import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How does multi-company functionality work?",
      answer: "FUSION provides complete data isolation between companies while allowing users to switch context seamlessly. Each company has its own workspace, members, projects, and permissions. Users can be members of multiple companies but can only access one company's data at a time based on their active context."
    },
    {
      question: "Can I create custom workflows for different project types?",
      answer: "Absolutely! FUSION's workflow engine allows you to create custom workflows with unlimited states and transitions. Define your own approval processes, validation rules, and automated actions. Each workflow can be tailored to specific project types, departments, or business requirements."
    },
    {
      question: "What notification options are available?",
      answer: "FUSION supports comprehensive notification systems including in-app notifications with real-time badge updates, email notifications for important events, and webhook integrations for custom notification channels. All notifications are contextual and can be customized based on user roles and preferences."
    },
    {
      question: "How easy is it to import existing project data?",
      answer: "FUSION provides robust import tools for popular project management platforms including Jira, Asana, Trello, and CSV files. Our migration specialists can help with large-scale data transfers, ensuring all your historical data, relationships, and workflows are preserved during the transition."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently asked <span className="text-blue-600">questions</span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about FUSION's capabilities and features.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp size={24} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-400" />
                  )}
                </div>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-6 pt-2">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to help you get the most out of FUSION.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;